package edu.uth.wms.dto.response;
import edu.uth.wms.model.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;

    // Thông tin khách hàng
    private String customerName;
    private String toName;
    private String toPhone;
    private String toAddress;

    // Thống kê
    private Integer totalItems; // Tổng số loại sản phẩm
    private Integer totalQuantity; // Tổng số lượng

    private BigDecimal totalAmount; // Tổng tiền (Quan trọng để hiển thị bảng hóa đơn)

    // Thời gian
    private LocalDateTime createdDate;
    private String createdByName; // Nguoi lap phieu
    private String assignedPickerName; // Nhan vien lay hang
    // Chi tiết sản phẩm
    private List<OutboundDetailResponse> details;
}
