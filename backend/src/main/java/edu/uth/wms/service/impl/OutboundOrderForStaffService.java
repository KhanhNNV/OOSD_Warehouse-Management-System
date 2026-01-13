package edu.uth.wms.service.impl;

import edu.uth.wms.dto.response.OutboundDetailForStaffResponse;
import edu.uth.wms.dto.response.OutboundOrderForStaffResponse;
import edu.uth.wms.service.IOutboundOrderForStaffService;
import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.OutboundNote;
import edu.uth.wms.model.OutboundNoteDetail;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import edu.uth.wms.repository.ILocationRepository;
import edu.uth.wms.repository.IOutboundDetailRepository;
import edu.uth.wms.repository.IOutboundNoteDetailRepository;
import edu.uth.wms.repository.IOutboundNoteRepository;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor

public class OutboundOrderForStaffService implements IOutboundOrderForStaffService
{
    private final IOutboundOrderRepository outboundOrderRepository;
    private final IOutboundDetailRepository outboundDetailRepository;
    private final IOutboundNoteRepository outboundNoteRepository;
    private final IOutboundNoteDetailRepository outboundNoteDetailRepository;
    private final IUserRepository userRepository;
    private final ILocationRepository locationRepository;

    @Override
    @Transactional(readOnly = true) // Tối ưu tốc độ khi chỉ đọc dữ liệu
    public List<OutboundOrderForStaffResponse> getAllOrders() {
        // 1. Lấy tất cả đơn hàng từ Database
        List<OutboundOrder> entities = outboundOrderRepository.findAll();

        // 2. Convert từ Entity sang DTO để trả về Frontend
        return entities.stream().map(order -> {
            return OutboundOrderForStaffResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus().name()) // Enum -> String
                    .createdDate(order.getCreatedDate())

                    // Map Customer (Kiểm tra null cho an toàn)
                    .customer(order.getCustomer() != null
                            ? OutboundOrderForStaffResponse.CustomerSummary.builder()
                            .id(order.getCustomer().getId())
                            .name(order.getCustomer().getName())
                            .phone(order.getCustomer().getPhone())
                            .address(order.getCustomer().getAddress())
                            .build()
                            : null)

                    // Map User (Người tạo)
                    .createdBy(order.getCreatedBy() != null
                            ? OutboundOrderForStaffResponse.UserSummary.builder()
                            .id(order.getCreatedBy().getId())
                            .fullName(order.getCreatedBy().getFullName())
                            .username(order.getCreatedBy().getUsername())
                            .build()
                            : null)

                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OutboundDetailForStaffResponse> getOutboundDetails(Long outboundOrderId) {
        outboundOrderRepository.findById(outboundOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // Thuật toán của Thiên
        Long locId = 9999L; // ID này phải tồn tại trong bảng Locations DB
        String locCode = "TEST-A-01";
        // - Lấy list outbound_details
        var outboundDetails = outboundDetailRepository.findByOutboundOrderId(outboundOrderId);
        return outboundDetails.stream().map(detail -> OutboundDetailForStaffResponse.builder()
                        .id(detail.getId())
                        .productId(detail.getProduct().getId())
                        .productSku(detail.getProduct().getSku())
                        .productName(detail.getProduct().getName())
                        .unit(detail.getProduct().getUnit())
                        .requested_qty(detail.getRequestedQty())
                        // Thiếu 2 cái của Thiên
                        .recommendedLocationId(locId)
                        .recommendedLocationCode(locCode)

                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(rollbackFor = Exception.class) // Gặp bất kỳ lỗi gì sẽ Rollback DB
    public void submitBatchPicking(Long orderId, List<BatchPickingRequest> items) {

        // 1. Lấy đơn hàng gốc
        OutboundOrder order = outboundOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đơn hàng ID: " + orderId));

        // 2. Lấy thông tin User đang đăng nhập (QUAN TRỌNG)
        String currentUsername = SecurityUtils.getCurrentUserLogin();

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thông tin nhân viên: " + currentUsername));

        // 3. Tạo OutboundNote (Phiếu xuất kho thực tế) - Để làm bằng chứng xuất kho
        OutboundNote note = new OutboundNote();
        note.setOutboundOrder(order);
        note.setStatus(OutboundNoteStatus.COMPLETED);
        note.setCreatedBy(currentUser);

        // Lưu Note trước để lấy ID (cho các detail tham chiếu tới)
        note = outboundNoteRepository.save(note);

        List<OutboundNoteDetail> noteDetails = new ArrayList<>();

        // 4. VÒNG LẶP KIỂM TRA & XỬ LÝ (CHECKING LOOP)
        for (BatchPickingRequest item : items) {

            // A. Lấy thông tin gốc từ Outbound Detail (Kế hoạch)
            OutboundDetail originalDetail = outboundDetailRepository.findById(item.getOutboundDetailId())
                    .orElseThrow(() -> new BadRequestException(
                            "Dữ liệu lỗi: Không tìm thấy chi tiết nhiệm vụ ID: "
                                    + item.getOutboundDetailId()));

            // B. CHECK 1: Sản phẩm có khớp nhau không?
            if (!originalDetail.getProduct().getId().equals(item.getProductId())) {
                throw new BadRequestException(
                        "Sai lệch sản phẩm! Yêu cầu SP " + originalDetail.getProduct().getSku()
                                + " nhưng nhận được ID " + item.getProductId());
            }

            // C. CHECK 2: Số lượng (Quan trọng)
            // Logic: Nếu Staff không đánh dấu lỗi (isFlagged = false) nhưng số lượng thực <
            // yêu cầu -> LỖI
            if (Boolean.FALSE.equals(item.getIsFlagged())
                    && item.getActualQty() < originalDetail.getRequestedQty()) {
                throw new BadRequestException(
                        "Số lượng không hợp lệ cho SP " + originalDetail.getProduct().getSku()
                                + ". Yêu cầu: " + originalDetail.getRequestedQty()
                                + ", Thực tế báo về: " + item.getActualQty());
            }

            // D. Nếu OK -> Tạo dòng OutboundNoteDetail (Thực tế)
            OutboundNoteDetail noteDetail = new OutboundNoteDetail();
            noteDetail.setOutboundNote(note);
            noteDetail.setProduct(originalDetail.getProduct());
            noteDetail.setQuantity(item.getActualQty());

            // noteDetail.setLocation();

            noteDetails.add(noteDetail);
        }

        // 5. Lưu tất cả chi tiết phiếu xuất vào DB
        outboundNoteDetailRepository.saveAll(noteDetails);

        // 6. Cập nhật trạng thái đơn hàng gốc -> Đã đóng gói (PACKED)
        order.setStatus(OrderStatus.PACKED);
        outboundOrderRepository.save(order);
    }
}
