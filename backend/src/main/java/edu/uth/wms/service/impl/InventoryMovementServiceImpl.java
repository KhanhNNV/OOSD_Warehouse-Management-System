package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.dto.response.InventoryResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException; // Giả sử bạn đã có class này
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IInventoryMovementService;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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

    @Override
    public void pickFromStageToTransit(String username, InternalPickRequest request) {
        // 1. Validate & Load Data
        User user = getUser(username);
        Products product = getProduct(request.getProductId());
        Locations stageLoc = getLocationById(request.getStageLocationId());
        Locations transitLoc = getOrCreateTransitLocation(user);

        // 2. Validate Source Location Type
        if (!LocationType.STAGE_LOC.equals(stageLoc.getLocationType())) {
            throw new ResourceNotFoundException("Vị trí nguồn không phải là khu vực STAGE");
        }

        // 3. Move Inventory (Trả về tồn kho đích để ghi log)
        Inventory destInventory = moveInventory(product, request.getQuantity(), stageLoc, transitLoc,null,null);

        // 4. Log Transaction
        logTransaction(TransactionType.INTERNAL_PICK, product, request.getQuantity(),
                transitLoc, user, destInventory);
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

        // 3. Move Inventory
        Inventory destInventory = moveInventory(product, request.getQuantity(), transitLoc, shelfLoc,request.getManufactureDate(), request.getExpiryDate());

        // 4. Log Transaction
        logTransaction(TransactionType.PUT_AWAY, product, request.getQuantity(),
                shelfLoc, user, destInventory);
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
                .map(inv -> new InventoryResponse(
                        inv.getId(),
                        inv.getProduct().getId(),
                        inv.getProduct().getName(),
                        inv.getProduct().getBarcode(),
                        inv.getQuantity(),
                        inv.getProduct().getImage_url(),
                        inv.getProduct().getSku()
                ))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PRIVATE HELPER METHODS (CORE LOGIC)
    // =========================================================================

    /**
     * Logic di chuyển tồn kho: Trừ Nguồn -> Cộng Đích.
     * @return Inventory tại đích (để phục vụ việc ghi log quantity_after)
     */
    private Inventory moveInventory(Products product, Integer qty, Locations fromLoc, Locations toLoc, LocalDate newMfgDate, LocalDate newExpDate) {
        // --- BƯỚC 1: TRỪ KHO NGUỒN ---
        Inventory fromInv = inventoryRepo.findByProductAndLocation(product, fromLoc)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy sản phẩm " + product.getSku() + " tại vị trí " + fromLoc.getCode()));

        int remainingQty = fromInv.getQuantity() - qty;

        if (remainingQty < 0) {
            throw new BadRequestException(String.format("Không đủ tồn kho. Yêu cầu: %d, Hiện có: %d",
                    qty, fromInv.getQuantity()));
        }

        if (remainingQty == 0) {
            inventoryRepo.delete(fromInv);
        } else {
            fromInv.setQuantity(remainingQty);
            inventoryRepo.save(fromInv);
        }

        // --- BƯỚC 2: CỘNG KHO ĐÍCH ---
        Inventory toInv = inventoryRepo.findByProductAndLocation(product, toLoc)
                .orElse(Inventory.builder()
                        .product(product)
                        .location(toLoc)
                        .quantity(0)
                        // Copy date từ nguồn để đảm bảo data nhất quán (hoặc set null tùy logic)
                        .build());

        // --- BƯỚC 3: XỬ LÝ DATE (QUAN TRỌNG) ---
        // Logic: Nếu có date mới (từ input PutAway) -> Dùng date mới.
        //        Nếu không có (null) -> Copy date từ nguồn (fromInv).

        // Xử lý Manufacture Date
        if (newMfgDate != null) {
            toInv.setManufactureDate(newMfgDate);
        } else if (toInv.getManufactureDate() == null) {
            // Chỉ copy nếu đích chưa có date (tránh ghi đè nếu merge vào lô cũ khác date)
            toInv.setManufactureDate(fromInv.getManufactureDate());
        }

        // Xử lý Expiry Date
        if (newExpDate != null) {
            toInv.setExpiryDate(newExpDate);
        } else if (toInv.getExpiryDate() == null) {
            toInv.setExpiryDate(fromInv.getExpiryDate());
        }

        // Nếu dùng builder phía trên thì không cần check id null để set lại product/location nữa
        toInv.setQuantity(toInv.getQuantity() + qty);

        return inventoryRepo.save(toInv);
    }

    /**
     * Ghi lịch sử giao dịch.
     * Tính toán quantity_before và quantity_after dựa trên kết quả di chuyển.
     */
    private void logTransaction(TransactionType type, Products product, Integer qtyChanged,
                                Locations locationRef, User user, Inventory destInventory) {

        // Logic fix lỗi "quantity_after cannot be null":
        // destInventory là trạng thái SAU khi đã cộng.
        int qtyAfter = destInventory.getQuantity();
        int qtyBefore = qtyAfter - qtyChanged;

        InventoryTransaction trans = InventoryTransaction.builder()
                .type(type)
                .product(product)
                .location(locationRef) // Ghi nhận vị trí đích của giao dịch
                .performedBy(user)
                .quantityChanged(qtyChanged)
                .quantityAfter(qtyAfter)   // <--- QUAN TRỌNG
                .quantityBefore(qtyBefore) // <--- QUAN TRỌNG
                // Timestamp được @PrePersist xử lý, nhưng set luôn cũng không sao
                // .referenceDocId(...) // Nếu có mã đơn hàng thì set vào đây
                .build();

        transactionRepo.save(trans);
    }

    /**
     * Lấy hoặc tạo vị trí ảo (Transit) cho nhân viên
     */
    private Locations getOrCreateTransitLocation(User user) {
        String transitCode = "TRANSIT_" + user.getId();
        return locationRepo.findByCode(transitCode)
                .orElseGet(() -> locationRepo.save(Locations.builder()
                        .code(transitCode)
                        .locationType(LocationType.TRANSIT)
                        .isFull(false)
                        .build()));
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
}