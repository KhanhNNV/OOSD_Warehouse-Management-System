package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IOutboundService;
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

    // Services
    private final ISystemConfigService configService;
    private final PickingStrategyFactory strategyFactory;


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

    @Override
    @Transactional
    public ScanPickResponse processScanPick(ScanPickRequest request) {
        // 1. Tìm OutboundNote (Phiếu xuất) trước để lấy ngữ cảnh đơn hàng
        OutboundNote note = outboundNoteRepo.findByOutboundOrderId(request.getOrderId())
                .orElseThrow(() -> new BadRequestException("Chưa tạo phiếu xuất kho (Vui lòng bấm nhận đơn trước)"));

        // 2. Tìm Inventory
        Inventory inventory = inventoryRepo.findById(request.getInventoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Inventory ID: " + request.getInventoryId()));

        // --- VALIDATION 1: CHECK LOCATION (Code location scan phải đúng với vị trí thực tế của Inventory) ---
        if (!inventory.getLocation().getCode().equals(request.getLocationCode())) {
            throw new BadRequestException("Sai vị trí! Sản phẩm đang ở kệ " + inventory.getLocation().getCode()
                    + " nhưng bạn đang scan " + request.getLocationCode());
        }

        // --- VALIDATION 2: CHECK QUANTITY (Không được lấy quá số lượng đơn hàng yêu cầu) ---
        // a. Lấy số lượng khách đặt cho sản phẩm này
        OutboundDetail orderDetail = note.getOutboundOrder().getDetails().stream()
                .filter(d -> d.getProduct().getId().equals(inventory.getProduct().getId()))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm này không có trong đơn hàng!"));

        int requestedQty = orderDetail.getRequestedQty();

        // b. Lấy số lượng đã soạn (đã scan trước đó) trong OutboundNoteDetail
        // Lưu ý: Một sản phẩm có thể được lấy từ nhiều kệ khác nhau, nên phải sum lại hết các dòng detail của sản phẩm đó
        List<OutboundNoteDetail> existingDetails = outboundNoteDetailRepo.findAllByOutboundNoteId(note.getId());

        int alreadyPickedQty = existingDetails.stream()
                .filter(d -> d.getProduct().getId().equals(inventory.getProduct().getId()))
                .mapToInt(OutboundNoteDetail::getQuantity)
                .sum();

        // c. Kiểm tra logic
        if (alreadyPickedQty + request.getQuantity() > requestedQty) {
            int remaining = requestedQty - alreadyPickedQty;
            throw new BadRequestException("Lấy dư hàng! Đơn cần " + requestedQty
                    + ", đã lấy " + alreadyPickedQty
                    + ". Chỉ cần lấy thêm tối đa: " + remaining);
        }

        // --- VALIDATION 3: CHECK KHO (Kho phải đủ hàng) ---
        if (inventory.getQuantity() < request.getQuantity()) {
            throw new BadRequestException("Số lượng tồn kho không đủ (Tồn: " + inventory.getQuantity() + ")");
        }

        // ================= XỬ LÝ GHI DỮ LIỆU (Giữ nguyên logic cũ) =================

        // 3. Cập nhật hoặc tạo mới OutboundNoteDetail
        // Tìm xem đã có dòng nào của SP này tại Kệ này trong Note chưa
        OutboundNoteDetail noteDetail = outboundNoteDetailRepo.findByOutboundNoteIdAndProductIdAndSourceLocationId(
                        note.getId(), inventory.getProduct().getId(), inventory.getLocation().getId())
                .orElse(null);

        if (noteDetail == null) {
            noteDetail = new OutboundNoteDetail();
            noteDetail.setOutboundNote(note);
            noteDetail.setProduct(inventory.getProduct());
            noteDetail.setSourceLocation(inventory.getLocation());
            noteDetail.setQuantity(request.getQuantity());
        } else {
            noteDetail.setQuantity(noteDetail.getQuantity() + request.getQuantity());
        }
        outboundNoteDetailRepo.save(noteDetail);

        // 4. TRỪ TỒN KHO & UPDATE ALLOCATED
        int oldQty = inventory.getQuantity();
        inventory.setQuantity(oldQty - request.getQuantity());

        // Quan trọng: Trừ Allocated để giải phóng kho
        int oldAllocated = inventory.getQuantityAllocated() == null ? 0 : inventory.getQuantityAllocated();
        inventory.setQuantityAllocated(Math.max(0, oldAllocated - request.getQuantity()));

        inventoryRepo.save(inventory);

        // 5. Ghi Log Transaction
        InventoryTransaction trans = new InventoryTransaction();
        trans.setProduct(inventory.getProduct());
        trans.setLocation(inventory.getLocation());
        trans.setType(TransactionType.OUTBOUND_SHIP);
        trans.setQuantityBefore(oldQty);
        trans.setQuantityChanged(-request.getQuantity());
        trans.setQuantityAfter(inventory.getQuantity());
        trans.setReferenceDocId(note.getCode());
        trans.setPerformedBy(userRepo.findByUsername(SecurityUtils.getCurrentUserLogin()).orElse(null));
        trans.setTimestamp(LocalDateTime.now());

        transactionRepo.save(trans);

        // --- BỔ SUNG: CHECK TỰ ĐỘNG HOÀN THÀNH ---
        // (Optional) Nếu muốn scan món cuối cùng thì báo luôn
        boolean isFullyPicked = (alreadyPickedQty + request.getQuantity() == requestedQty);

        return ScanPickResponse.builder()
                .success(true)
                .message("Đã lấy " + request.getQuantity() + " sản phẩm." + (isFullyPicked ? " (Đã đủ số lượng)" : ""))
                .currentInventory(inventory.getQuantity())
                .build();
    }


    @Override
    @Transactional
    public void finishPicking(Long orderId) {
        OutboundOrder order = outboundOrderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Đơn hàng không tồn tại"));

        OutboundNote note = outboundNoteRepo.findByOutboundOrderId(orderId)
                .orElseThrow(() -> new RuntimeException("Phiếu xuất không tồn tại"));

        // Validate: Đã lấy đủ số lượng chưa?
        for (OutboundDetail detail : order.getDetails()) {
            // Tính tổng đã pick cho sản phẩm này
            int picked = note.getDetails().stream()
                    .filter(d -> d.getProduct().getId().equals(detail.getProduct().getId()))
                    .mapToInt(OutboundNoteDetail::getQuantity)
                    .sum();

            if (picked < detail.getRequestedQty()) {
                throw new RuntimeException("Chưa soạn đủ hàng! Sản phẩm " + detail.getProduct().getSku()
                        + " còn thiếu " + (detail.getRequestedQty() - picked));
            }
        }

        // Update trạng thái
        order.setStatus(OrderStatus.PACKED); // Hoặc SHIPPED tùy quy trình
        note.setStatus(OutboundNoteStatus.COMPLETED);

        outboundOrderRepo.save(order);
        outboundNoteRepo.save(note);
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
                    .inventoryId(inv.getId())
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

        //- Lưu trạng thái đơn hàng
        order.setStatus(OrderStatus.PICKING);

        outboundOrderRepo.save(order);

        //- Tạo phiếu xuất kho
        OutboundNote note = new OutboundNote();
        note.setOutboundOrder(order);
        note.setCreatedBy(currentStaff);
        note.setStatus(OutboundNoteStatus.DRAFT);
        note.setCreatedAt(LocalDateTime.now());

        note.setCode(order.getOrderNumber());

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



}