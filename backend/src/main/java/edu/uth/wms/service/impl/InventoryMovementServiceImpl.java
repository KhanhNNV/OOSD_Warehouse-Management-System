package edu.uth.wms.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors; // Giả sử bạn đã có class này

import edu.uth.wms.dto.request.RelocateRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.dto.response.InventoryResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.InventoryTransaction;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.repository.IInventoryRepository;
import edu.uth.wms.repository.ILocationRepository;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.ITransactionRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.IInventoryMovementService;
import edu.uth.wms.service.IStocktakeService;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class InventoryMovementServiceImpl implements IInventoryMovementService {

    private final IInventoryRepository inventoryRepo;
    private final ILocationRepository locationRepo;
    private final ITransactionRepository transactionRepo;
    private final IUserRepository userRepo;
    private final IProductRepository productRepo;
    private final IStocktakeService stocktakeService;

    @Override
    @Transactional
    public String pickFromStageToTransit(String username, List<InternalPickRequest> requests) {
        User user = getUser(username);
        Locations transitLoc = getOrCreateTransitLocation(user);

        String refId = "PNP-" + System.currentTimeMillis();

        for (InternalPickRequest req : requests) {
            Products product = getProduct(req.getProductId());
            Locations stageLoc = getLocationById(req.getStageLocationId());

            if (!LocationType.STAGE_LOC.equals(stageLoc.getLocationType())) {
                throw new ResourceNotFoundException("Vị trí " + stageLoc.getCode() + " không phải STAGE");
            }

            Inventory destInventory = moveInventory(product, req.getQuantity(), stageLoc, transitLoc, null);

            logTransaction(TransactionType.INTERNAL_PICK, product, req.getQuantity(), transitLoc, user, destInventory, refId);
        }

        return refId;
    }

    @Override
    public void putAwayToShelf(String username, PutAwayRequest request) {

        User user = getUser(username);
        Products product = getProduct(request.getProductId());
        Locations transitLoc = getOrCreateTransitLocation(user);
        Locations shelfLoc = getLocationByCode(request.getTargetShelfCode());


        if (!LocationType.SHELF_STORAGE.equals(shelfLoc.getLocationType())) {
            throw new BadRequestException("Vị trí đích phải là kệ lưu trữ (SHELF_STORAGE)");
        }

        if (Boolean.TRUE.equals(shelfLoc.getIsFull())) {
            throw new BadRequestException(
                    String.format("Vị trí %s đã được đánh dấu đầy. Vui lòng chọn vị trí khác.", shelfLoc.getCode()));
        }


        Inventory destInventory = moveInventory(product, request.getQuantity(), transitLoc, shelfLoc,
                request.getExpiryDate());


        if (Boolean.TRUE.equals(request.getMarkLocationFull())) {
            shelfLoc.setIsFull(true);
            locationRepo.save(shelfLoc);

        }

        String refId = request.getReferenceDocId();
        if (refId == null || refId.isEmpty()) {
            refId = "PNP-" + System.currentTimeMillis() + "-MISSING";
        }

        logTransaction(TransactionType.PUT_AWAY, product, request.getQuantity(), shelfLoc, user, destInventory,refId);
        log.info("Put-away hoàn thành: {} đơn vị sản phẩm {} vào Vị trí {} (Đầy: {})", request.getQuantity(),
                product.getSku(), shelfLoc.getCode(), shelfLoc.getIsFull());
    }

    @Override
    public List<InventoryResponse> getTransitInventory() {
        User user = getUser(SecurityUtils.getCurrentUserLogin());
        String transitCode = "TRANSIT_" + user.getId();

        Optional<Locations> transitLocOpt = locationRepo.findByCode(transitCode);
        if (transitLocOpt.isEmpty()) {
            return Collections.emptyList();
        }

        List<Inventory> inventories = inventoryRepo.findByLocation(transitLocOpt.get());

        return inventories.stream()
                .map(inv -> new InventoryResponse(inv.getId(), inv.getProduct().getId(), inv.getProduct().getName(),
                        inv.getProduct().getBarcode(), inv.getQuantity(), inv.getProduct().getImage_url(),
                        inv.getProduct().getSku()))
                .collect(Collectors.toList());
    }


    private Inventory moveInventory(Products product, Integer qty, Locations fromLoc, Locations toLoc,
            LocalDate newExpDate) {

        // --- KIỂM TRA LOCK (STOCKTAKE) ---
        if (stocktakeService.isLocationLocked(fromLoc.getCode())) {
            throw new BadRequestException("Vị trí nguồn " + fromLoc.getCode() + " đang bị khóa để kiểm kê!");
        }
        if (stocktakeService.isLocationLocked(toLoc.getCode())) {
            throw new BadRequestException("Vị trí đích " + toLoc.getCode() + " đang bị khóa để kiểm kê!");
        }

        // --- TRỪ KHO NGUỒN ---
        Inventory fromInv = inventoryRepo.findByProductAndLocation(product, fromLoc)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm " + product.getSku() + " tại vị trí " + fromLoc.getCode()));

        int remainingQty = fromInv.getQuantity() - qty;

        if (remainingQty < 0) {
            throw new BadRequestException(
                    String.format("Không đủ tồn kho. Yêu cầu: %d, Hiện có: %d", qty, fromInv.getQuantity()));
        }

        fromInv.setQuantity(remainingQty);
        inventoryRepo.save(fromInv);


        LocalDate targetExpiryDate = (newExpDate != null) ? newExpDate : fromInv.getExpiryDate();
        LocalDate targetMfgDate = LocalDate.now();

        // --- CỘNG KHO ĐÍCH ---
        Optional<Inventory> existingDestInv = inventoryRepo.findExistingBatch(product, toLoc, targetExpiryDate, targetMfgDate);

        Inventory toInv;
        if (existingDestInv.isPresent()) {
            toInv = existingDestInv.get();
            toInv.setQuantity(toInv.getQuantity() + qty);
        } else {
            toInv = Inventory.builder()
                    .product(product)
                    .location(toLoc)
                    .quantity(qty)
                    .expiryDate(targetExpiryDate)
                    .manufactureDate(targetMfgDate)
                    .build();
        }

        return inventoryRepo.save(toInv);
    }


    private void logTransaction(TransactionType type, Products product, Integer qtyChanged, Locations locationRef,
            User user, Inventory destInventory,String refId) {

        int qtyAfter = destInventory.getQuantity();
        int qtyBefore = qtyAfter - qtyChanged;

        InventoryTransaction trans = InventoryTransaction.builder().type(type).product(product).location(locationRef)
                .performedBy(user).quantityChanged(qtyChanged).quantityAfter(qtyAfter)
                .quantityBefore(qtyBefore)
                .referenceDocId(refId)
                .build();

        transactionRepo.save(trans);
    }

    private Locations getOrCreateTransitLocation(User user) {
        String transitCode = "TRANSIT_" + user.getId();
        return locationRepo.findByCode(transitCode).orElseGet(() -> locationRepo
                .save(Locations.builder().code(transitCode).locationType(LocationType.TRANSIT).isFull(false).build()));
    }


    private User getUser(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại: " + username));
    }

    private Products getProduct(Long productId) {
        return productRepo.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId));
    }

    private Locations getLocationById(Long locationId) {
        return locationRepo.findById(locationId)
                .orElseThrow(() -> new ResourceNotFoundException("Vị trí không tồn tại ID: " + locationId));
    }

    private Locations getLocationByCode(String code) {
        return locationRepo.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Vị trí không tồn tại mã: " + code));
    }

    @Override
    @Transactional
    public void relocateInventory(String username, RelocateRequest request) {
        if (stocktakeService.isLocationLocked(request.getFromLocationCode()) || stocktakeService.isLocationLocked(request.getToLocationCode())) {
            throw new BadRequestException("Vị trí đang bị KHÓA kiểm kê, không thể di chuyển.");
        }

        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        //Lấy Inventory NGUỒN & Sản phẩm
        Locations fromLoc = locationRepo.findByCode(request.getFromLocationCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vị trí nguồn"));
        Products product = productRepo.findByBarcode(request.getBarcode())
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));

        Inventory sourceInv = inventoryRepo.findByLocationIdAndProductId(fromLoc.getId(), product.getId())
                .orElseThrow(() -> new BadRequestException("Không có hàng tại vị trí nguồn"));

        // Check số lượng khả dụng
        int available = sourceInv.getQuantity() - (sourceInv.getQuantityAllocated() != null ? sourceInv.getQuantityAllocated() : 0);
        if (available < request.getQuantity()) {
            throw new BadRequestException("Không đủ hàng khả dụng để chuyển.");
        }

        String refId = "MOV-" + System.currentTimeMillis();

        // === TRỪ KHO NGUỒN (SOURCE) ===
        int qtyBeforeSource = sourceInv.getQuantity();
        sourceInv.setQuantity(qtyBeforeSource - request.getQuantity());

        // Lưu Inventory Nguồn
        if (sourceInv.getQuantity() == 0 && sourceInv.getQuantityAllocated() == 0) {
            inventoryRepo.delete(sourceInv); // Xóa nếu hết sạch
        } else {
            inventoryRepo.save(sourceInv);
        }

        createTransaction(
                TransactionType.RELOCATION, // Hoặc INTERNAL_PICK nếu không sửa Enum
                product, fromLoc, user,
                qtyBeforeSource, -request.getQuantity(), (qtyBeforeSource - request.getQuantity()), // Âm lượng để thể hiện xuất
                refId
        );


        // === CỘNG KHO ĐÍCH ===
        Locations toLoc = locationRepo.findByCode(request.getToLocationCode())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vị trí đích"));

        Inventory destInv = inventoryRepo.findByLocationIdAndProductId(toLoc.getId(), product.getId())
                .orElse(Inventory.builder()
                        .product(product)
                        .location(toLoc)
                        .quantity(0)
                        .quantityAllocated(0)
                        .build());

        int qtyBeforeDest = destInv.getQuantity();
        destInv.setQuantity(qtyBeforeDest + request.getQuantity());
        inventoryRepo.save(destInv);

        createTransaction(
                TransactionType.RELOCATION, // Hoặc PUT_AWAY nếu không sửa Enum
                product, toLoc, user,
                qtyBeforeDest, request.getQuantity(), (qtyBeforeDest + request.getQuantity()), // Dương lượng để thể hiện nhập
                refId
        );

        log.info("Đã chuyển {} {} từ {} sang {} (Ref: {})", request.getQuantity(), request.getBarcode(), request.getFromLocationCode(), request.getToLocationCode(), refId);
    }

    private void createTransaction(TransactionType type, Products product, Locations loc, User user,
                                   int before, int change, int after, String refId) {

        InventoryTransaction trans = InventoryTransaction.builder()
                .type(type)
                .product(product)
                .location(loc)
                .performedBy(user)
                .quantityBefore(before)
                .quantityChanged(change)
                .quantityAfter(after)
                .referenceDocId(refId)
                .timestamp(LocalDateTime.now())
                .build();

        transactionRepo.save(trans);
    }
}