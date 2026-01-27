package edu.uth.wms.dto.response;
import edu.uth.wms.model.enums.OrderStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonProperty;

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
    // Thời gian hoàn thành picking/xuất kho
    private LocalDateTime exportedDate;

    private String assignedPickerName; // Nhan vien lay hang
    private Long assignedPickerId;      // ID nhân viên (để so sánh logic màu sắc)
    @JsonProperty("isAssignedToCurrentUser")
    private boolean isAssignedToCurrentUser; // Cờ quan trọng để Frontend biết có enable nút hay không
    
    private String noteCode;
    // Chi tiết sản phẩm
    private List<OutboundDetailResponse> details;

}
