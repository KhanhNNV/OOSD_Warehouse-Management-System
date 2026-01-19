package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IOutboundService;
import edu.uth.wms.service.IStocktakeService;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.strategy.*;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SERVICE XUẤT KHO
 * Đã cập nhật: Logic Khóa/Mở khóa tồn kho và Kiểm tra khả năng cung ứng
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
    private final IInventoryRepository inventoryRepository;
    private final IStocktakeService stocktakeService;

    // Services
    private final ISystemConfigService configService;
    private final PickingStrategyFactory strategyFactory;

    // =================================================================
    // 1. TẠO ĐƠN HÀNG XUẤT MỚI & KHÓA SẢN PHẨM (LOCKING)
    // =================================================================
    @Override
    @Transactional
    public OutboundOrderResponse createOutboundOrder(String username, OutboundOrderCreateRequest request) {
        log.info("📦 [CREATE ORDER] User {} đang tạo đơn xuất kho mới", username);

        // --- BƯỚC 1: Validate & Load User ---
        User creator = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        // Lấy chiến lược (Strategy) hiện tại (FIFO/FEFO)
        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        // --- BƯỚC 2: Tạo Outbound Order ---
        OutboundOrder order = OutboundOrder.builder()
                .orderNumber(generateOrderNumber())
                .status(OrderStatus.NEW) // Mặc định là NEW, sẽ chuyển ALLOCATED nếu giữ chỗ thành công
                .toName(request.getToName())
                .toPhone(request.getToPhone())
                .toAddress(request.getToAddress())
                .createdBy(creator)
                .createdDate(LocalDateTime.now())
                .build();

        List<OutboundDetail> details = new ArrayList<>();

        // --- BƯỚC 3: Duyệt từng sản phẩm để KHÓA HÀNG (Allocation) ---
        for (OutboundItemRequest item : request.getItems()) {
            Products product = productRepo.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            // 3.1. Lấy tất cả tồn kho của sản phẩm
            List<Inventory> inventories = inventoryRepo.findAllByProductId(product.getId());

            // 3.2. Chạy thuật toán để tìm các kệ phù hợp
            List<Inventory> suggestedInventories = strategy.suggestPickingOrder(product, item.getQuantity(), inventories);

            // 3.3. Nếu thuật toán trả về rỗng -> Không đủ hàng
            if (suggestedInventories.isEmpty()) {
                throw new RuntimeException("Không đủ tồn kho khả dụng cho sản phẩm: " + product.getSku() + " (Cần: " + item.getQuantity() + ")");
            }

            // 3.4. THỰC HIỆN KHÓA HÀNG (Tăng quantityAllocated)
            int remainingToLock = item.getQuantity();
            
            for (Inventory inv : suggestedInventories) {
                if (remainingToLock <= 0) break;
                                // Kiểm tra LOCK
                if (stocktakeService.isLocationLocked(inv.getLocation().getCode())) {
                    continue; // Bỏ qua kệ đang bị khóa kiểm kê
                }
                
                // Tính số lượng khả dụng tại kệ này (Tổng - Đã khóa)
                int currentAllocated = inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated();
                int availableAtLoc = inv.getQuantity() - currentAllocated;
                
                // Lấy số lượng cần khóa từ kệ này (min giữa cần lấy và có sẵn)
                int lockQty = Math.min(remainingToLock, availableAtLoc);

                if (lockQty > 0) {
                    inv.setQuantityAllocated(currentAllocated + lockQty);
                    inventoryRepo.save(inv);
                    
                    remainingToLock -= lockQty;
                    
                    log.info("🔒 [LOCK] Đã giữ chỗ {} {} tại kệ {}", lockQty, product.getSku(), inv.getLocation().getCode());
                }
            }

            // 3.5. Kiểm tra lại nếu vẫn chưa lock đủ (Logic an toàn)
            if (remainingToLock > 0) {
                 throw new RuntimeException("Lỗi hệ thống: Không thể giữ chỗ đủ số lượng cho " + product.getSku());
            }

            // 3.6. Tạo chi tiết đơn hàng
            OutboundDetail detail = OutboundDetail.builder()
                    .outboundOrder(order)
                    .product(product)
                    .requestedQty(item.getQuantity())
                    .allocatedQty(item.getQuantity()) // Đánh dấu là đã được giữ chỗ đủ
                    .build();

            details.add(detail);
        }
        
        order.setDetails(details);
        order.setStatus(OrderStatus.ALLOCATED); // Cập nhật trạng thái: ĐÃ GIỮ CHỖ

        // --- BƯỚC 4: Lưu database ---
        OutboundOrder savedOrder = outboundOrderRepo.save(order);

        log.info("✅ [CREATE ORDER] Đã tạo và giữ chỗ thành công đơn: {}", savedOrder.getOrderNumber());

        return mapToResponse(savedOrder);
    }

    // =================================================================
    // 2. GỢI Ý KỆ HÀNG (PICKING INSTRUCTION)
    // =================================================================
    @Override
    public PickingInstructionResponse getPickingInstruction(Long orderId) {
        log.info("🗺️ [PICKING INSTRUCTION] Tạo chỉ dẫn lấy hàng cho đơn ID: {}", orderId);

        OutboundOrder order = outboundOrderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        List<PickingTaskResponse> tasks = new ArrayList<>();

        for (OutboundDetail detail : order.getDetails()) {
            Products product = detail.getProduct();
            Integer neededQty = detail.getRequestedQty();

            // Lấy tồn kho. Lưu ý: Vì ta đã khóa hàng (Allocated tăng), 
            // nên thuật toán cần logic để nhận diện hàng đã khóa cho chính đơn này.
            // Tuy nhiên, để đơn giản hóa trong mô hình hiện tại không có bảng Allocation chi tiết,
            // ta sẽ tạm thời chạy lại thuật toán trên tổng tồn kho (bao gồm cả phần đã khóa) 
            // hoặc chấp nhận hiển thị lại dựa trên trạng thái hiện tại.
            // Ở đây ta gọi lại findAll để lấy state mới nhất.
            List<Inventory> allInventories = inventoryRepo.findAllByProductId(product.getId());


            List<Inventory> candidates = allInventories.stream()
                    .filter(inv -> inv.getLocation() != null)
                    .filter(inv -> !"STAGE_LOC".equals(inv.getLocation().getLocationType().name()))
                    .filter(inv -> !inv.getLocation().getCode().startsWith("TRANSIT_"))
                    .filter(inv -> inv.getQuantity() > 0) // ✅ Chỉ cần tồn lý thuyết > 0
                    .collect(Collectors.toList());

            // Chạy thuật toán sắp xếp
            // *Lưu ý*: Nếu strategy lọc bỏ hàng đã allocated, kết quả có thể bị sai lệch nếu không có context.
            // Nhưng với yêu cầu hiện tại, ta cứ hiển thị gợi ý theo logic ưu tiên.
            List<Inventory> sortedInventories = strategy.sortInventories(
                    candidates);
            
            // Nếu sortedInventories rỗng (do đã bị lock hết bởi chính đơn này), 
            // ta có thể cần fallback logic để hiển thị "Đã giữ chỗ tại...".
            // Nhưng để code chạy được luồng Happy Path, ta giả định strategy trả về danh sách ưu tiên.

            List<LocationPickingDetail> locationDetails = calculatePickingPlan(neededQty, sortedInventories);

            int totalPicked = locationDetails.stream().mapToInt(LocationPickingDetail::getQtyToPickFromHere).sum();
            if (totalPicked < neededQty) {
                log.warn("Cảnh báo: Đơn {} sản phẩm {} cần {} nhưng chỉ tìm được {} (Do lệch tồn kho)",
                        order.getOrderNumber(), product.getSku(), neededQty, totalPicked);
            }

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
    // 3. XÁC NHẬN XUẤT KHO -> MỞ KHÓA & TRỪ TỒN (UNLOCK & DEDUCT)
    // =================================================================
    @Override
    @Transactional
    public OutboundNoteResponse confirmPicking(String username, ConfirmPickingRequest request) {
        log.info("📤 [CONFIRM PICKING] Staff {} xác nhận xuất hàng cho đơn ID: {}",
                username, request.getOutboundOrderId());

        User staff = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        OutboundOrder order = outboundOrderRepo.findById(request.getOutboundOrderId())
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        // Tạo phiếu xuất kho
        OutboundNote note = OutboundNote.builder()
                .code(generateNoteCode())
                .outboundOrder(order)
                .status(OutboundNoteStatus.COMPLETED)
                .createdBy(staff)
                .createdAt(LocalDateTime.now())
                .exportedDate(LocalDateTime.now())
                .build();

        List<OutboundNoteDetail> noteDetails = new ArrayList<>();

        for (PickedItemDetail pickedItem : request.getPickedItems()) {
            // Kiểm tra LOCK
            if (stocktakeService.isLocationLocked(pickedItem.getLocationCode())) {
                throw new RuntimeException("Vị trí " + pickedItem.getLocationCode() + " đang bị khóa để kiểm kê!");
            }
            Inventory inventory = inventoryRepo.findByProductIdAndLocationCode(
                    pickedItem.getProductId(),
                    pickedItem.getLocationCode())
                    .orElseThrow(() -> new RuntimeException("Inventory not found at " + pickedItem.getLocationCode()));

            // 3.1. TRỪ TỒN KHO THỰC TẾ (Physical Stock)
            int qtyBefore = inventory.getQuantity();
            if (inventory.getQuantity() < pickedItem.getQuantity()) {
                 throw new RuntimeException("Lỗi: Tồn kho không đủ để xuất tại " + pickedItem.getLocationCode());
            }
            inventory.setQuantity(inventory.getQuantity() - pickedItem.getQuantity());

            // 3.2. MỞ KHÓA (UNLOCK / Release Allocation)
            // Vì hàng đã xuất đi rồi, ta giảm lượng giữ chỗ tương ứng
            int currentAllocated = inventory.getQuantityAllocated() == null ? 0 : inventory.getQuantityAllocated();
            int newAllocated = Math.max(0, currentAllocated - pickedItem.getQuantity());
            inventory.setQuantityAllocated(newAllocated);

            inventoryRepo.save(inventory);

            log.info("🔓 [UNLOCK & DEDUCT] Kệ {}: Trừ {} thực tế, Giảm {} giữ chỗ. Tồn mới: {}", 
                    pickedItem.getLocationCode(), pickedItem.getQuantity(), pickedItem.getQuantity(), inventory.getQuantity());

            // 3.3. Ghi log transaction
            Products product = inventory.getProduct();
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

            // 3.4. Tạo chi tiết phiếu xuất
            OutboundNoteDetail noteDetail = OutboundNoteDetail.builder()
                    .outboundNote(note)
                    .product(product)
                    .sourceLocation(inventory.getLocation())
                    .quantity(pickedItem.getQuantity())
                    .build();

            noteDetails.add(noteDetail);
        }

        note.setDetails(noteDetails);
        
        // Cập nhật trạng thái đơn hàng
        order.setStatus(OrderStatus.SHIPPED);
        outboundOrderRepo.save(order);
        
        OutboundNote savedNote = outboundNoteRepo.save(note);
        log.info("🎉 [CONFIRM PICKING] Hoàn tất xuất kho. Phiếu: {}", savedNote.getCode());

        return mapNoteToResponse(savedNote);
    }

    // =================================================================
    // 4. KIỂM TRA KHẢ NĂNG CUNG ỨNG (CHECK STOCK AVAILABILITY)
    // =================================================================
    @Override
    public Boolean checkStockAvailability(Long productId, Integer quantity) {
        // 1. Lấy Product
        Products product = productRepo.findById(productId)
            .orElseThrow(() -> new RuntimeException("Product not found"));

        // 2. Lấy toàn bộ inventory
        List<Inventory> inventories = inventoryRepo.findAllByProductId(productId);

        // 3. Lấy Strategy hiện tại
        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        // 4. Chạy thử thuật toán (thuật toán này đã check quantity - allocated > 0)
        List<Inventory> suggested = strategy.suggestPickingOrder(product, quantity, inventories);

        // 5. Nếu danh sách gợi ý không rỗng -> Có đủ hàng để đáp ứng
        return !suggested.isEmpty();
    }

    // =================================================================
    // 5. HỦY ĐƠN HÀNG (CANCEL & RELEASE LOCK)
    // =================================================================
    @Override
@Transactional
public void cancelOrder(Long orderId) {
    OutboundOrder order = outboundOrderRepo.findById(orderId)
            .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

    if (order.getStatus() == OrderStatus.SHIPPED) {
        throw new RuntimeException("Không thể hủy đơn hàng đã xuất kho");
    }

    // --- BỔ SUNG: TRẢ LẠI SỐ LƯỢNG ĐÃ KHÓA (RELEASE LOCK) ---
    // Duyệt qua từng chi tiết đơn hàng để biết sản phẩm nào đã được giữ chỗ
    for (OutboundDetail detail : order.getDetails()) {
        int qtyToRelease = detail.getAllocatedQty(); // Số lượng đã giữ chỗ cho dòng này
        if (qtyToRelease > 0) {
            Products product = detail.getProduct();
            
            // Tìm các Inventory đang giữ chỗ cho sản phẩm này (Logic FIFO hoặc trừ dần)
            // Lưu ý: Do ta không lưu chi tiết "Inventory ID nào giữ cho Order ID nào",
            // nên ta phải trừ vào quantityAllocated của bất kỳ kệ nào đang có quantityAllocated > 0 của sản phẩm đó.
            
            List<Inventory> lockedInventories = inventoryRepo.findAllByProductId(product.getId());
            
            for (Inventory inv : lockedInventories) {
                if (qtyToRelease <= 0) break;
                
                int currentLocked = inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated();
                if (currentLocked > 0) {
                    int releaseHere = Math.min(qtyToRelease, currentLocked);
                    
                    inv.setQuantityAllocated(currentLocked - releaseHere);
                    inventoryRepo.save(inv);
                    
                    qtyToRelease -= releaseHere;
                }
            }
        }
    }
    // --------------------------------------------------------

    order.setStatus(OrderStatus.CANCELLED);
    outboundOrderRepo.save(order);
    log.info("❌ [CANCEL ORDER] Đã hủy đơn và hoàn trả tồn kho: {}", order.getOrderNumber());
}

    // =================================================================
    // CRUD CƠ BẢN & HELPER
    // =================================================================

    @Override
    public List<OutboundOrderResponse> getPendingOrders() {
        return outboundOrderRepo.findPendingOrders().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

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

    private List<LocationPickingDetail> calculatePickingPlan(
            Integer totalNeeded,
            List<Inventory> sortedInventories) {
        List<LocationPickingDetail> plan = new ArrayList<>();
        int remaining = totalNeeded;

        for (Inventory inv : sortedInventories) {
            if (remaining <= 0) break;

            int pickFromHere = Math.min(remaining, inv.getQuantity());

            plan.add(LocationPickingDetail.builder()
                    .locationCode(inv.getLocation().getCode())
                    .qtyToPickFromHere(pickFromHere)
                    .availableQty(inv.getQuantity()) // Hiển thị tồn kho vật lý
                    .expiryDate(inv.getExpiryDate() != null ? inv.getExpiryDate().toString() : null)
                    .manufactureDate(inv.getManufactureDate() != null ? inv.getManufactureDate().toString() : null)
                    .build());

            remaining -= pickFromHere;
        }
        return plan;
    }

    private String generateOrderNumber() {
        return "OB-" + System.currentTimeMillis();
    }
    
    private String generateNoteCode() {
        return "PXK-" + System.currentTimeMillis();
    }

    private OutboundOrderResponse mapToResponse(OutboundOrder order) {
        List<OutboundDetailResponse> detailResponses = order.getDetails().stream()
                .map(d -> OutboundDetailResponse.builder()
                        .productId(d.getProduct().getId())
                        .productSku(d.getProduct().getSku())
                        .productName(d.getProduct().getName())
                        .requestedQty(d.getRequestedQty())
                        .build())
                .collect(Collectors.toList());
        Long pickerId = null;
        String pickerName = null;
        boolean isMine = false;
        if (order.getStatus() == OrderStatus.PICKING || 
            order.getStatus() == OrderStatus.PACKED  || 
            order.getStatus() == OrderStatus.SHIPPED) {
                Optional<OutboundNote> noteOpt = outboundNoteRepo.findByOutboundOrderId(order.getId());
            
            if (noteOpt.isPresent()) {
                User picker = noteOpt.get().getCreatedBy();
                if (picker != null) {
                    pickerId = picker.getId();
                    pickerName = picker.getFullName();
                    
                    // Check xem có phải user hiện tại không
                    String currentUsername = SecurityUtils.getCurrentUserLogin();
                    if (currentUsername != null && currentUsername.equals(picker.getUsername())) {
                        isMine = true;
                    }
                }
            }
        }
        return OutboundOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())
                .toName(order.getToName())
                .toPhone(order.getToPhone())
                .toAddress(order.getToAddress())
                .totalItems(order.getDetails().size())
                .totalQuantity(order.getDetails().stream().mapToInt(OutboundDetail::getRequestedQty).sum())
                .createdDate(order.getCreatedDate())
                .details(detailResponses)
                //Thông tin của staff
                .assignedPickerId(pickerId)
                .assignedPickerName(pickerName)
                .isAssignedToCurrentUser(isMine)
                .build();
    }

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

    @Override
    @Transactional
    public String registerPicking(Long orderId) {

        String username = SecurityUtils.getCurrentUserLogin();
        User currentStaff = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        OutboundOrder order = outboundOrderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));


        validateOrderForPicking(order);
        allocateInventoryForOrder(order);
        //- Lưu trạng thái đơn hàng
        order.setStatus(OrderStatus.PICKING);

        outboundOrderRepo.save(order);

        //- Tạo phiếu xuất kho
        OutboundNote note = new OutboundNote();
        note.setOutboundOrder(order);
        note.setCreatedBy(currentStaff);
        note.setStatus(OutboundNoteStatus.DRAFT);
        note.setCreatedAt(LocalDateTime.now());

        String generatedCode = "OBN-" + order.getOrderNumber() + "-" + System.currentTimeMillis() % 1000;
        note.setCode(generatedCode);

        outboundNoteRepo.save(note);
        return "Đăng ký thành công! Mã phiếu: " + note.getCode();
    }

    //===========================================================
    // Đây là Switch Expression (có từ Java 14 trở lên)
    // Hàm này chỉ có nhiệm vụ: "Chặn cửa". Nếu qua được cửa thì thôi, không qua được thì báo lỗi cụ thể.
    private void validateOrderForPicking(OutboundOrder order) {
        OrderStatus currentStatus = order.getStatus();

        // Dùng Switch Expression: Vừa gọn, vừa dễ đọc hơn if-else nhiều
        String errorMessage = switch (currentStatus) {
            case PICKING   -> "Đơn hàng này đã có người khác nhận rồi!"; // Status cũ là Picking
            case CANCELLED -> "Đơn hàng này đã bị hủy, không thể nhận!";
            case SHIPPED   -> "Đơn hàng đã xuất kho hoàn tất!";
            case PACKED    -> "Đơn hàng đã đóng gói xong, không cần soạn nữa!";
            case NEW, ALLOCATED -> null; // Đây là 2 trạng thái HỢP LỆ để nhận đơn -> Trả về null (không lỗi)
            default        -> "Trạng thái đơn hàng không hợp lệ: " + currentStatus;
        };

        // Nếu có thông báo lỗi (tức là rơi vào các case xấu), thì Ném Exception ngay
        if (errorMessage != null) {
            throw new RuntimeException(errorMessage);
        }
    }

    // =================================================================
    // HÀM PHỤ: CHỈ CHỊU TRÁCH NHIỆM TÍNH TOÁN VÀ KHÓA KHO
    // =================================================================
    private void allocateInventoryForOrder(OutboundOrder order) {
        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        // Duyệt từng sản phẩm trong đơn để khóa
        for (OutboundDetail detail : order.getDetails()) {
            Products product = detail.getProduct();
            int qtyNeeded = detail.getRequestedQty();

            // 1. Lấy tồn kho
            List<Inventory> inventories = inventoryRepository.findAllByProductId(product.getId());

            // 2. Chạy thuật toán gợi ý
            List<Inventory> suggested = strategy.suggestPickingOrder(product, qtyNeeded, inventories);

            if (suggested.isEmpty()) {
                throw new RuntimeException("Lỗi: Không đủ tồn kho khả dụng cho sản phẩm " + product.getSku());
            }

            // 3. Thực hiện Update DB (Khóa hàng)
            int remainingToLock = qtyNeeded;
            for (Inventory inv : suggested) {
                if (remainingToLock <= 0) break;
                // Kiểm tra LOCK
                if (stocktakeService.isLocationLocked(inv.getLocation().getCode())) {
                    continue;
                }
                int currentAllocated = inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated();
                int currentTotal = inv.getQuantity() == null ? 0 : inv.getQuantity();
                
                // Available = Tổng - Đã khóa
                int availableAtLoc = currentTotal - currentAllocated;

                int lockQty = Math.min(remainingToLock, availableAtLoc);

                if (lockQty > 0) {
                    inv.setQuantityAllocated(currentAllocated + lockQty);
                    inventoryRepository.save(inv); // Lưu thay đổi
                    remainingToLock -= lockQty;
                }
            }
            
            // Check an toàn
            if (remainingToLock > 0) {
                 throw new RuntimeException("Lỗi hệ thống: Không thể giữ chỗ đủ số lượng cho " + product.getSku());
            }
        }
    }
}