package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IOutboundService;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.strategy.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SERVICE XUẤT KHO - PHẦN 1: TẠO ĐƠN & GỢI Ý KỆ
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class OutboundServiceImpl implements IOutboundService {

    // Repositories
    private final IOutboundOrderRepository outboundOrderRepo;
    private final IOutboundDetailRepository outboundDetailRepo;
    private final IOutboundNoteRepository outboundNoteRepo;
    private final IOutboundNoteDetailRepository outboundNoteDetailRepo;
    private final IProductRepository productRepo;
    private final IInventoryRepository inventoryRepo;
    private final ILocationRepository locationRepo;
    private final IUserRepository userRepo;
    private final ITransactionRepository transactionRepo;

    // Services
    private final ISystemConfigService configService;
    private final PickingStrategyFactory strategyFactory;

    // =================================================================
    // 1. TẠO ĐƠN HÀNG XUẤT MỚI (MANAGER)
    // =================================================================
    @Override
    @Transactional
    public OutboundOrderResponse createOutboundOrder(String username, OutboundOrderCreateRequest request) {
        log.info("📦 [CREATE ORDER] User {} đang tạo đơn xuất kho mới", username);

        // --- BƯỚC 1: Validate & Load User ---
        User creator = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // --- BƯỚC 2: Tạo Outbound Order ---
        OutboundOrder order = OutboundOrder.builder()
                .orderNumber(generateOrderNumber())
                .status(OrderStatus.NEW)
                .toName(request.getToName())
                .toPhone(request.getToPhone())
                .toAddress(request.getToAddress())
                .createdBy(creator)
                .createdDate(LocalDateTime.now())
                .build();

        // --- BƯỚC 3: Thêm chi tiết sản phẩm ---
        List<OutboundDetail> details = new ArrayList<>();
        for (OutboundItemRequest item : request.getItems()) {
            Products product = productRepo.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            OutboundDetail detail = OutboundDetail.builder()
                    .outboundOrder(order)
                    .product(product)
                    .requestedQty(item.getRequestedQty())
                    .allocatedQty(0) // Chưa phân bổ
                    .build();

            details.add(detail);
        }
        order.setDetails(details);

        // --- BƯỚC 4: Lưu database ---
        OutboundOrder savedOrder = outboundOrderRepo.save(order);

        log.info("✅ [CREATE ORDER] Đã tạo đơn: {} với {} sản phẩm",
                savedOrder.getOrderNumber(), details.size());

        return mapToResponse(savedOrder);
    }

    // =================================================================
    // 2. GỢI Ý KỆ HÀNG CHO STAFF (PICKING INSTRUCTION)
    // =================================================================
    @Override
    public PickingInstructionResponse getPickingInstruction(Long orderId) {
        log.info("🗺️ [PICKING INSTRUCTION] Tạo chỉ dẫn lấy hàng cho đơn ID: {}", orderId);

        // --- BƯỚC 1: Load đơn hàng ---
        OutboundOrder order = outboundOrderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // --- BƯỚC 2: Lấy thuật toán hiện tại ---
        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        log.info("📊 [PICKING INSTRUCTION] Sử dụng thuật toán: {}", strategy.getAlgorithmName());

        // --- BƯỚC 3: Tạo chỉ dẫn cho từng sản phẩm ---
        List<PickingTaskResponse> tasks = new ArrayList<>();

        for (OutboundDetail detail : order.getDetails()) {
            Products product = detail.getProduct();
            Integer neededQty = detail.getRequestedQty();

            // Lấy tất cả kệ có sản phẩm này
            List<Inventory> allInventories = inventoryRepo.findAllByProductId(product.getId());

            // Chạy thuật toán sắp xếp
            List<Inventory> sortedInventories = strategy.suggestPickingOrder(
                    product, neededQty, allInventories);

            // Tính toán lấy từ kệ nào, bao nhiêu
            List<LocationPickingDetail> locationDetails = calculatePickingPlan(
                    neededQty, sortedInventories);

            tasks.add(PickingTaskResponse.builder()
                    .productId(product.getId())
                    .productSku(product.getSku())
                    .productName(product.getName())
                    .totalNeeded(neededQty)
                    .locations(locationDetails)
                    .build());
        }

        return PickingInstructionResponse.builder()
                .orderId(order.getId())
                .orderNumber(order.getOrderNumber())
                .algorithm(strategy.getAlgorithmName())
                .tasks(tasks)
                .build();
    }

    // =================================================================
    // HELPER: TÍNH TOÁN KẾ HOẠCH LẤY HÀNG
    // =================================================================
    /**
     * Tính toán: Cần lấy bao nhiêu từ mỗi kệ
     * 
     * LOGIC:
     * - Lấy từ kệ đầu tiên (đã được thuật toán sắp xếp)
     * - Nếu không đủ -> Lấy tiếp từ kệ thứ 2
     * - Cứ thế cho đến khi đủ số lượng
     */
    private List<LocationPickingDetail> calculatePickingPlan(
            Integer totalNeeded,
            List<Inventory> sortedInventories) {
        List<LocationPickingDetail> plan = new ArrayList<>();
        int remaining = totalNeeded;

        for (Inventory inv : sortedInventories) {
            if (remaining <= 0)
                break;

            int pickFromHere = Math.min(remaining, inv.getQuantity());

            plan.add(LocationPickingDetail.builder()
                    .locationCode(inv.getLocation().getCode())
                    .qtyToPickFromHere(pickFromHere)
                    .availableQty(inv.getQuantity())
                    .expiryDate(inv.getExpiryDate() != null ? inv.getExpiryDate().toString() : null)
                    .manufactureDate(inv.getManufactureDate() != null ? inv.getManufactureDate().toString() : null)
                    .build());

            remaining -= pickFromHere;
        }

        if (remaining > 0) {
            log.warn("⚠️ [PICKING PLAN] Thiếu hàng! Còn thiếu: {} sản phẩm", remaining);
        }

        return plan;
    }

    // =================================================================
    // HELPER: GENERATE ORDER NUMBER
    // =================================================================
    private String generateOrderNumber() {
        return "OB-" + System.currentTimeMillis();
    }

    // =================================================================
    // HELPER: MAP TO RESPONSE
    // =================================================================
    private OutboundOrderResponse mapToResponse(OutboundOrder order) {
        List<OutboundDetailResponse> detailResponses = order.getDetails().stream()
                .map(d -> OutboundDetailResponse.builder()
                        .productId(d.getProduct().getId())
                        .productSku(d.getProduct().getSku())
                        .productName(d.getProduct().getName())
                        .requestedQty(d.getRequestedQty())
                        .allocatedQty(d.getAllocatedQty())
                        .build())
                .collect(Collectors.toList());

        return OutboundOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus().name())
                .toName(order.getToName())
                .toPhone(order.getToPhone())
                .toAddress(order.getToAddress())
                .totalItems(order.getDetails().size())
                .totalQuantity(order.getDetails().stream().mapToInt(OutboundDetail::getRequestedQty).sum())
                .createdDate(order.getCreatedDate().toString())
                .details(detailResponses)
                .build();
    }

    // =================================================================
    // 3. LẤY DANH SÁCH ĐƠN HÀNG CHỜ XUẤT
    // =================================================================
    @Override
    public List<OutboundOrderResponse> getPendingOrders() {
        return outboundOrderRepo.findPendingOrders().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    // ========================================
    // PHẦN 2: XÁC NHẬN XUẤT KHO (STAFF)
    // ========================================

    /**
     * Staff xác nhận đã lấy hàng và trừ tồn kho
     */
    @Override
    @Transactional
    public OutboundNoteResponse confirmPicking(String username, ConfirmPickingRequest request) {
        log.info("📤 [CONFIRM PICKING] Staff {} xác nhận xuất hàng cho đơn ID: {}",
                username, request.getOutboundOrderId());

        // ===============================================
        // BƯỚC 1: VALIDATE & LOAD DATA
        // ===============================================
        User staff = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        OutboundOrder order = outboundOrderRepo.findById(request.getOutboundOrderId())
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        // ===============================================
        // BƯỚC 2: TẠO OUTBOUND NOTE (PHIẾU XUẤT KHO)
        // ===============================================
        OutboundNote note = OutboundNote.builder()
                .code(generateNoteCode())
                .outboundOrder(order)
                .status(OutboundNoteStatus.COMPLETED)
                .createdBy(staff)
                .createdAt(LocalDateTime.now())
                .exportedDate(LocalDateTime.now())
                .build();

        // ===============================================
        // BƯỚC 3: XỬ LÝ TỪNG SẢN PHẨM ĐƯỢC STAFF SCAN
        // ===============================================
        List<OutboundNoteDetail> noteDetails = new ArrayList<>();

        for (PickedItemDetail pickedItem : request.getPickedItems()) {
            // 3.1. Validate sản phẩm
            Products product = productRepo.findById(pickedItem.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại"));

            // 3.2. Tìm inventory tại kệ được chỉ định
            Inventory inventory = inventoryRepo.findByProductIdAndLocationCode(
                    pickedItem.getProductId(),
                    pickedItem.getLocationCode())
                    .orElseThrow(() -> new RuntimeException(
                            "Không tìm thấy sản phẩm " + product.getSku() +
                                    " tại kệ " + pickedItem.getLocationCode()));

            // 3.3. Kiểm tra đủ tồn kho không
            if (inventory.getQuantity() < pickedItem.getQuantity()) {
                throw new RuntimeException(String.format(
                        "Không đủ tồn kho tại %s. Yêu cầu: %d, Hiện có: %d",
                        pickedItem.getLocationCode(),
                        pickedItem.getQuantity(),
                        inventory.getQuantity()));
            }

            // 3.4. TRỪ TỒN KHO (QUAN TRỌNG!)
            int qtyBefore = inventory.getQuantity();
            inventory.setQuantity(inventory.getQuantity() - pickedItem.getQuantity());
            inventoryRepo.save(inventory);

            log.info("✅ [DEDUCT STOCK] Trừ {} {} từ kệ {}. Còn lại: {}",
                    pickedItem.getQuantity(),
                    product.getSku(),
                    pickedItem.getLocationCode(),
                    inventory.getQuantity());

            // 3.5. Ghi log transaction
            InventoryTransaction transaction = InventoryTransaction.builder()
                    .type(TransactionType.OUTBOUND_SHIP)
                    .product(product)
                    .location(inventory.getLocation())
                    .quantityBefore(qtyBefore)
                    .quantityChanged(pickedItem.getQuantity())
                    .quantityAfter(inventory.getQuantity())
                    .performedBy(staff)
                    .referenceDocId(note.getCode())
                    .build();
            transactionRepo.save(transaction);

            // 3.6. Tạo chi tiết phiếu xuất
            OutboundNoteDetail noteDetail = OutboundNoteDetail.builder()
                    .outboundNote(note)
                    .product(product)
                    .sourceLocation(inventory.getLocation())
                    .quantity(pickedItem.getQuantity())
                    .build();

            noteDetails.add(noteDetail);
        }

        note.setDetails(noteDetails);

        // ===============================================
        // BƯỚC 4: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
        // ===============================================
        order.setStatus(OrderStatus.SHIPPED);
        outboundOrderRepo.save(order);

        // ===============================================
        // BƯỚC 5: LƯU PHIẾU XUẤT
        // ===============================================
        OutboundNote savedNote = outboundNoteRepo.save(note);

        log.info("🎉 [CONFIRM PICKING] Hoàn tất xuất kho. Phiếu: {}", savedNote.getCode());

        return mapNoteToResponse(savedNote);
    }

    // =================================================================
    // HELPER: GENERATE NOTE CODE
    // =================================================================
    private String generateNoteCode() {
        return "PXK-" + System.currentTimeMillis();
    }

    // =================================================================
    // HELPER: MAP NOTE TO RESPONSE
    // =================================================================
    private OutboundNoteResponse mapNoteToResponse(OutboundNote note) {
        List<ExportedItemDetail> items = note.getDetails().stream()
                .map(d -> ExportedItemDetail.builder()
                        .productName(d.getProduct().getName())
                        .locationCode(d.getSourceLocation().getCode())
                        .quantity(d.getQuantity())
                        .build())
                .collect(Collectors.toList());

        return OutboundNoteResponse.builder()
                .noteCode(note.getCode())
                .orderNumber(note.getOutboundOrder().getOrderNumber())
                .status(note.getStatus().name())
                .exportedDate(note.getExportedDate() != null ? note.getExportedDate().toString() : null)
                .items(items)
                .build();
    }

    // =================================================================
    // CRUD CƠ BẢN
    // =================================================================

    @Override
    public List<OutboundOrderResponse> getAllOrders() {
        return outboundOrderRepo.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public OutboundOrderResponse getOrderById(Long id) {
        OutboundOrder order = outboundOrderRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));
        return mapToResponse(order);
    }

    @Override
    @Transactional
    public void cancelOrder(Long orderId) {
        OutboundOrder order = outboundOrderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        order.setStatus(OrderStatus.CANCELLED);
        outboundOrderRepo.save(order);

        log.info("❌ [CANCEL ORDER] Đã hủy đơn: {}", order.getOrderNumber());
    }
}