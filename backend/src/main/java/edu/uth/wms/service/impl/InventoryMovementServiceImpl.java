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
        // 1. Validate dữ liệu đầu vào
        User user = getUser(username);
        Locations transitLoc = getOrCreateTransitLocation(user);

        // 2. Sinh ONE refId duy nhất cho cả lô hàng
        String refId = "PNP-" + System.currentTimeMillis();

        // 3. Loop xử lý từng món hàng
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
        // 1. Validate & Load Data
        User user = getUser(username);
        Products product = getProduct(request.getProductId());
        Locations transitLoc = getOrCreateTransitLocation(user);
        Locations shelfLoc = getLocationByCode(request.getTargetShelfCode());

        // 2. Validate Destination Location Type
        if (!LocationType.SHELF_STORAGE.equals(shelfLoc.getLocationType())) {
            throw new BadRequestException("Vị trí đích phải là kệ lưu trữ (SHELF_STORAGE)");
        }

        if (Boolean.TRUE.equals(shelfLoc.getIsFull())) {
            throw new BadRequestException(
                    String.format("Vị trí %s đã được đánh dấu đầy. Vui lòng chọn vị trí khác.", shelfLoc.getCode()));
        }

        // 3. Move Inventory
        Inventory destInventory = moveInventory(product, request.getQuantity(), transitLoc, shelfLoc,
                request.getExpiryDate());

        // Mark location as full if requested
        if (Boolean.TRUE.equals(request.getMarkLocationFull())) {
            shelfLoc.setIsFull(true);
            locationRepo.save(shelfLoc);

        }

        String refId = request.getReferenceDocId();
        if (refId == null || refId.isEmpty()) {
            refId = "PNP-" + System.currentTimeMillis() + "-MISSING"; // Đánh dấu là bị mất mã gốc
        }

        // 4. Log Transaction
        logTransaction(TransactionType.PUT_AWAY, product, request.getQuantity(), shelfLoc, user, destInventory,refId);
        log.info("Put-away completed: {} units of {} to Location {} (isFull: {})", request.getQuantity(),
                product.getSku(), shelfLoc.getCode(), shelfLoc.getIsFull());
    }

    @Override
    public List<InventoryResponse> getTransitInventory() {
        // 1. Tìm vị trí TRANSIT của user
        User user = getUser(SecurityUtils.getCurrentUserLogin());
        String transitCode = "TRANSIT_" + user.getId();

        // 2. Tìm Location (nếu chưa có thì trả về rỗng)
        Optional<Locations> transitLocOpt = locationRepo.findByCode(transitCode);
        if (transitLocOpt.isEmpty()) {
            return Collections.emptyList();
        }

        // 3. Lấy tất cả inventory tại vị trí này
        List<Inventory> inventories = inventoryRepo.findByLocation(transitLocOpt.get());

        // 4. Map sang DTO để trả về Frontend
        return inventories.stream()
                .map(inv -> new InventoryResponse(inv.getId(), inv.getProduct().getId(), inv.getProduct().getName(),
                        inv.getProduct().getBarcode(), inv.getQuantity(), inv.getProduct().getImage_url(),
                        inv.getProduct().getSku()))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PRIVATE HELPER METHODS (CORE LOGIC)
    // =========================================================================

    /**
     * Logic di chuyển tồn kho: Trừ Nguồn -> Cộng Đích.
     *
     * @return Inventory tại đích (để phục vụ việc ghi log quantity_after)
     */
    private Inventory moveInventory(Products product, Integer qty, Locations fromLoc, Locations toLoc,
            LocalDate newExpDate) {

        // --- KIỂM TRA LOCK (STOCKTAKE) ---
        if (stocktakeService.isLocationLocked(fromLoc.getCode())) {
            throw new BadRequestException("Vị trí nguồn " + fromLoc.getCode() + " đang bị khóa để kiểm kê!");
        }
        if (stocktakeService.isLocationLocked(toLoc.getCode())) {
            throw new BadRequestException("Vị trí đích " + toLoc.getCode() + " đang bị khóa để kiểm kê!");
        }

        // --- BƯỚC 1: TRỪ KHO NGUỒN ---
        Inventory fromInv = inventoryRepo.findByProductAndLocation(product, fromLoc)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm " + product.getSku() + " tại vị trí " + fromLoc.getCode()));

        int remainingQty = fromInv.getQuantity() - qty;

        if (remainingQty < 0) {
            throw new BadRequestException(
                    String.format("Không đủ tồn kho. Yêu cầu: %d, Hiện có: %d", qty, fromInv.getQuantity()));
        }

        if (remainingQty == 0) {
            inventoryRepo.delete(fromInv);
        } else {
            fromInv.setQuantity(remainingQty);
            inventoryRepo.save(fromInv);
        }

        // --- BƯỚC 2: CỘNG KHO ĐÍCH ---
        Inventory toInv = inventoryRepo.findByProductAndLocation(product, toLoc)
                .orElse(Inventory.builder().product(product).location(toLoc).quantity(0)
                        // Copy date từ nguồn để đảm bảo data nhất quán (hoặc set null tùy logic)
                        .build());

        // --- BƯỚC 3: XỬ LÝ DATE (QUAN TRỌNG) ---
        // Xử lý Expiry Date
        if (newExpDate != null) {
            toInv.setExpiryDate(newExpDate);
        } else if (toInv.getExpiryDate() == null) {
            toInv.setExpiryDate(fromInv.getExpiryDate());
        }
        toInv.setManufactureDate(LocalDate.now());

        // Nếu dùng builder phía trên thì không cần check id null để set lại
        // product/location nữa
        toInv.setQuantity(toInv.getQuantity() + qty);

        return inventoryRepo.save(toInv);
    }

    /**
     * Ghi lịch sử giao dịch. Tính toán quantity_before và quantity_after dựa trên
     * kết quả di chuyển.
     */
    private void logTransaction(TransactionType type, Products product, Integer qtyChanged, Locations locationRef,
            User user, Inventory destInventory,String refId) {

        // Logic fix lỗi "quantity_after cannot be null":
        // destInventory là trạng thái SAU khi đã cộng.
        int qtyAfter = destInventory.getQuantity();
        int qtyBefore = qtyAfter - qtyChanged;

        InventoryTransaction trans = InventoryTransaction.builder().type(type).product(product).location(locationRef)
                .performedBy(user).quantityChanged(qtyChanged).quantityAfter(qtyAfter)
                .quantityBefore(qtyBefore)
                .referenceDocId(refId)
                .build();

        transactionRepo.save(trans);
    }

    /**
     * Lấy hoặc tạo vị trí ảo (Transit) cho nhân viên
     */
    private Locations getOrCreateTransitLocation(User user) {
        String transitCode = "TRANSIT_" + user.getId();
        return locationRepo.findByCode(transitCode).orElseGet(() -> locationRepo
                .save(Locations.builder().code(transitCode).locationType(LocationType.TRANSIT).isFull(false).build()));
    }

    // --- Các hàm tìm kiếm đơn giản để code chính gọn hơn ---

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
    @Transactional // Bắt buộc để đảm bảo tính nhất quán (trừ A cộng B cùng lúc)
    public void relocateInventory(String username, RelocateRequest request) {

        // 1. Validate cơ bản & Check Lock (Giữ nguyên logic cũ)
        if (stocktakeService.isLocationLocked(request.getFromLocationCode()) || stocktakeService.isLocationLocked(request.getToLocationCode())) {
            throw new BadRequestException("Vị trí đang bị KHÓA kiểm kê, không thể di chuyển.");
        }

        // 2. Lấy User thực hiện
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));

        // 3. Lấy Inventory NGUỒN & Sản phẩm
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

        // --- BẮT ĐẦU XỬ LÝ DATABASE ---

        // Tạo mã tham chiếu chung cho cả 2 transaction (Để biết 2 dòng này thuộc về 1 lần chuyển)
        String refId = "MOV-" + System.currentTimeMillis();

        // === BƯỚC A: TRỪ KHO NGUỒN (SOURCE) ===
        int qtyBeforeSource = sourceInv.getQuantity();
        sourceInv.setQuantity(qtyBeforeSource - request.getQuantity());

        // Lưu Inventory Nguồn
        if (sourceInv.getQuantity() == 0 && sourceInv.getQuantityAllocated() == 0) {
            inventoryRepo.delete(sourceInv); // Xóa nếu hết sạch
        } else {
            inventoryRepo.save(sourceInv);
        }

        // -> GHI LOG TRANSACTION 1 (XUẤT)
        createTransaction(
                TransactionType.RELOCATION, // Hoặc INTERNAL_PICK nếu không sửa Enum
                product, fromLoc, user,
                qtyBeforeSource, -request.getQuantity(), (qtyBeforeSource - request.getQuantity()), // Âm lượng để thể hiện xuất
                refId
        );


        // === BƯỚC B: CỘNG KHO ĐÍCH (DESTINATION) ===
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

        // -> GHI LOG TRANSACTION 2 (NHẬP)
        createTransaction(
                TransactionType.RELOCATION, // Hoặc PUT_AWAY nếu không sửa Enum
                product, toLoc, user,
                qtyBeforeDest, request.getQuantity(), (qtyBeforeDest + request.getQuantity()), // Dương lượng để thể hiện nhập
                refId
        );

        log.info("Đã chuyển {} {} từ {} sang {} (Ref: {})", request.getQuantity(), request.getBarcode(), request.getFromLocationCode(), request.getToLocationCode(), refId);
    }

    // Hàm helper để tạo Transaction theo đúng Model của bạn
    private void createTransaction(TransactionType type, Products product, Locations loc, User user,
                                   int before, int change, int after, String refId) {

        InventoryTransaction trans = InventoryTransaction.builder()
                .type(type)
                .product(product)
                .location(loc)
                .performedBy(user)
                .quantityBefore(before)
                .quantityChanged(change) // Quan trọng: Âm hoặc Dương
                .quantityAfter(after)
                .referenceDocId(refId)   // Quan trọng: Để gom nhóm
                .timestamp(LocalDateTime.now()) // PrePersist cũng sẽ set, nhưng set ở đây cho chắc
                .build();

        transactionRepo.save(trans);
    }
}