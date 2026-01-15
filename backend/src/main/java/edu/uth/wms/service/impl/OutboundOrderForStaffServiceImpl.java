package edu.uth.wms.service.impl;

import edu.uth.wms.service.IOutboundOrderForStaffService;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.strategy.PickingStrategy;
import edu.uth.wms.service.strategy.PickingStrategyFactory;
import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.dto.response.BatchPickingErrorDetail;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.BatchPickingException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.InventoryTransaction;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.OutboundNote;
import edu.uth.wms.model.OutboundNoteDetail;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import edu.uth.wms.model.enums.PickingAlgorithmType;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.repository.IInventoryRepository;
import edu.uth.wms.repository.IOutboundDetailRepository;
import edu.uth.wms.repository.IOutboundNoteDetailRepository;
import edu.uth.wms.repository.IOutboundNoteRepository;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.repository.ITransactionRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor

public class OutboundOrderForStaffServiceImpl implements IOutboundOrderForStaffService {
        private final IOutboundOrderRepository outboundOrderRepository;
        private final IOutboundDetailRepository outboundDetailRepository;
        private final IOutboundNoteRepository outboundNoteRepository;
        private final IOutboundNoteDetailRepository outboundNoteDetailRepository;
        private final IUserRepository userRepository;
        private final ISystemConfigService configService;
        private final PickingStrategyFactory strategyFactory;
        private final IInventoryRepository inventoryRepository;
        private final ITransactionRepository transactionRepository;

        // @Override
        // @Transactional(readOnly = true) // Tối ưu tốc độ khi chỉ đọc dữ liệu
        // {
        // public List<OutboundOrderForStaffResponse> getAllOrders() {
        // // 1. Lấy tất cả đơn hàng từ Database
        // List<OutboundOrder> entities = outboundOrderRepository.findAll();
        // // 2. Convert từ Entity sang DTO để trả về Frontend
        // return entities.stream().map(order -> {
        // return OutboundOrderForStaffResponse.builder()
        // .id(order.getId())
        // .orderNumber(order.getOrderNumber())
        // .status(order.getStatus().name()) // Enum -> String
        // .createdDate(order.getCreatedDate())
        // // Map Customer (Kiểm tra null cho an toàn)
        // .customer(order.getCustomer() != null
        // ? OutboundOrderForStaffResponse.CustomerSummary.builder()
        // .id(order.getCustomer().getId())
        // .name(order.getCustomer().getName())
        // .phone(order.getCustomer().getPhone())
        // .address(order.getCustomer().getAddress())
        // .build()
        // : null)
        // // Map User (Người tạo)
        // .createdBy(order.getCreatedBy() != null
        // ? OutboundOrderForStaffResponse.UserSummary.builder()
        // .id(order.getCreatedBy().getId())
        // .fullName(order.getCreatedBy().getFullName())
        // .username(order.getCreatedBy().getUsername())
        // .build()
        // : null)
        // .build();
        // }).collect(Collectors.toList());
        // }

        @Override
        @Transactional(readOnly = true)
        public List<OutboundDetailResponse> getOutboundDetails(Long outboundOrderId) {
                // Tìm user
                String currentUsername = SecurityUtils.getCurrentUserLogin();
                User currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
                // Tìm outbound_note đơn hàng hiện tại
                OutboundNote note = outboundNoteRepository.findByOutboundOrderId(outboundOrderId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Không tìm thấy phiếu xuất kho đơn hàng ID: " + outboundOrderId));

                if (!note.getCreatedBy().getId().equals(currentUser.getId())) {
                        throw new BadRequestException(
                                        "Bạn không có quyền truy cập! Đơn hàng này đang được xử lý bởi nhân viên khác ");
                }
                OutboundOrder order = note.getOutboundOrder();

                // Lấy chiến lược hiện tại (FIFO/FEFO) để sắp xếp thứ tự hiển thị các kệ cho
                // tiện đường đi
                PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
                PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

                List<OutboundDetailResponse> responseList = new ArrayList<>();
                // Duyệt từng sản phẩm bị khóa
                for (OutboundDetail detail : order.getDetails()) {
                        Products product = detail.getProduct();
                        int requestedQty = detail.getRequestedQty();

                        // Tìm những kệ hàng đang giữ chỗ (QuantityAllocated > 0) cho sản phẩm này
                        List<Inventory> allocatedInventories = inventoryRepository
                                        .findByProductIdAndQuantityAllocatedGreaterThan(product.getId(), 0);

                        if (allocatedInventories.isEmpty()) {
                                // Trường hợp lỗi dữ liệu: Đã nhận đơn nhưng không thấy kho khóa
                                // Vẫn hiện sản phẩm nhưng báo chưa xác định vị trí
                                responseList.add(mapToResponse(detail, null, requestedQty));
                                continue;
                        }

                        // Sắp xếp danh sách kệ theo chiến lược (Ví dụ: Date cũ hiện trước)
                        List<Inventory> sortedInventories = strategy.suggestPickingOrder(product, requestedQty,
                                        allocatedInventories);

                        // Chia nhỏ dòng hiển thị (Splitting)
                        int remainingQtyToPick = requestedQty;

                        for (Inventory inv : sortedInventories) {
                                if (remainingQtyToPick <= 0)
                                        break;

                                // Lấy số lượng đang được giữ chỗ tại kệ này
                                int allocatedAtLoc = inv.getQuantityAllocated() == null ? 0
                                                : inv.getQuantityAllocated();

                                // Số lượng Staff cần lấy tại kệ này = Min(Cần lấy, Đang giữ chỗ)
                                int pickAtLoc = Math.min(remainingQtyToPick, allocatedAtLoc);

                                if (pickAtLoc > 0) {
                                        // Map sang DTO và thêm vào list trả về
                                        responseList.add(mapToResponse(detail, inv, pickAtLoc));
                                        remainingQtyToPick -= pickAtLoc;
                                }
                        }

                }
                return responseList;
        }

        @Override
        @Transactional(rollbackFor = Exception.class) // Gặp bất kỳ lỗi gì sẽ Rollback DB
        public void submitBatchPicking(Long outboundOrderId, List<BatchPickingRequest> items) {
                // Tìm user
                String currentUsername = SecurityUtils.getCurrentUserLogin();
                User currentUser = userRepository.findByUsername(currentUsername)
                                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại"));
                // Tìm outbound_note đơn hàng hiện tại
                OutboundNote note = outboundNoteRepository.findByOutboundOrderId(outboundOrderId)
                                .orElseThrow(() -> new ResourceNotFoundException(
                                                "Không tìm thấy phiếu xuất kho đơn hàng ID: " + outboundOrderId));

                // So sánh id user với id user trong thằng note
                if (!note.getCreatedBy().getId().equals(currentUser.getId())) {
                        throw new BadRequestException(
                                        "Bạn không có quyền truy cập! Đơn hàng này đang được xử lý bởi nhân viên khác ");
                }

                List<BatchPickingErrorDetail> errors = new ArrayList<>();
                for (BatchPickingRequest item : items) {
                        if (item.getActualQty() == null || item.getActualQty() <= 0)
                                continue;

                        // Tìm inventory (Dùng findByProduct_IdAndLocation_Id cho khớp với Repository
                        // của bạn)
                        Inventory inventory = inventoryRepository
                                        .findByProduct_IdAndLocation_Id(item.getProductId(), item.getLocationId())
                                        .orElse(null);

                        if (inventory == null) {
                                errors.add(BatchPickingErrorDetail.builder()
                                                .productId(item.getProductId())
                                                .locationId(item.getLocationId())
                                                .errorMessage("Không tìm thấy dữ liệu tồn kho tại vị trí này.")
                                                .build());
                                continue;
                        }

                        if (inventory.getQuantity() < item.getActualQty()) {
                                errors.add(BatchPickingErrorDetail.builder()
                                                .productId(item.getProductId())
                                                .productSku(inventory.getProduct().getSku())
                                                .locationId(item.getLocationId())
                                                .locationCode(inventory.getLocation().getCode())
                                                .requestedQty(item.getActualQty())
                                                .availableQty(inventory.getQuantity())
                                                .errorMessage("Kho không đủ hàng! (Tồn: " + inventory.getQuantity()
                                                                + ")")
                                                .build());
                        }
                }

                // Nếu có lỗi -> Ném ra nguyên list
                if (!errors.isEmpty()) {
                        throw new BatchPickingException(errors);
                }

                // --- PHASE 2: XỬ LÝ (PROCESSING) ---
                List<OutboundNoteDetail> noteDetails = new ArrayList<>();

                for (BatchPickingRequest item : items) {
                        if (item.getActualQty() == null || item.getActualQty() <= 0)
                                continue;

                        Inventory inventory = inventoryRepository
                                        .findByProduct_IdAndLocation_Id(item.getProductId(), item.getLocationId())
                                        .get();

                        int pickedQty = item.getActualQty();
                        int oldQty = inventory.getQuantity();

                        // Trừ kho
                        inventory.setQuantity(oldQty - pickedQty);
                        int currentAllocated = inventory.getQuantityAllocated() == null ? 0
                                        : inventory.getQuantityAllocated();
                        inventory.setQuantityAllocated(Math.max(0, currentAllocated - pickedQty));
                        inventoryRepository.save(inventory);

                        // Lưu Transaction
                        InventoryTransaction trans = InventoryTransaction.builder()
                                        .product(inventory.getProduct())
                                        .location(inventory.getLocation())
                                        .type(TransactionType.OUTBOUND_SHIP)
                                        .quantityBefore(oldQty)
                                        .quantityChanged(pickedQty)
                                        .quantityAfter(inventory.getQuantity())
                                        .referenceDocId(note.getCode())
                                        .performedBy(currentUser)
                                        .build();
                        transactionRepository.save(trans);

                        // Tạo Note Detail
                        noteDetails.add(OutboundNoteDetail.builder()
                                        .outboundNote(note)
                                        .product(inventory.getProduct())
                                        .sourceLocation(inventory.getLocation())
                                        .quantity(pickedQty)
                                        .build());
                }

                // Hoàn tất
                if (note.getDetails() == null) {
                        note.setDetails(new ArrayList<>());
                } else {
                        note.getDetails().clear();
                }
                note.getDetails().addAll(noteDetails);
                note.setStatus(OutboundNoteStatus.COMPLETED);
                note.setExportedDate(LocalDateTime.now());
                outboundNoteRepository.save(note);

                OutboundOrder order = note.getOutboundOrder();
                order.setStatus(OrderStatus.PACKED);
                outboundOrderRepository.save(order);

        }

        // --- HÀM PHỤ TRỢ: Map Entity sang Response DTO ---
        private OutboundDetailResponse mapToResponse(OutboundDetail detail, Inventory inv, int pickupQty) {
                OutboundDetailResponse response = OutboundDetailResponse.builder()
                                .id(detail.getId()) // ID dòng chi tiết (để gửi lại khi submit)
                                .productId(detail.getProduct().getId())
                                .productSku(detail.getProduct().getSku())
                                .productName(detail.getProduct().getName())
                                .unit(detail.getProduct().getUnit())
                                .imageUrl(detail.getProduct().getImage_url()) // Hiện ảnh cho dễ tìm
                                .requestedQty(detail.getRequestedQty()) // Tổng số khách đặt
                                .pickupQty(pickupQty) // Số lượng CẦN LẤY tại vị trí này
                                .build();

                // Map thông tin vị trí (Location)
                if (inv != null && inv.getLocation() != null) {
                        response.setRecommendedLocationId(inv.getLocation().getId()); // ID kệ (gửi lại khi submit)
                        response.setRecommendedLocationCode(inv.getLocation().getCode()); // Mã kệ (hiển thị: A-01-02)
                } else {
                        response.setRecommendedLocationCode("KHO-CHUA-XAC-DINH");
                        response.setRecommendedLocationId(null);
                }

                return response;
        }

}
