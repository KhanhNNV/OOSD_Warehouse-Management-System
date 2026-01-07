package edu.uth.wms.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import edu.uth.wms.model.enums.OrderStatus;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutboundOrderResponse {
    private Long id;
    private String orderNumber;
    private OrderStatus status;

    private UserCreateRespone customer; // Thông tin khách hàng
    private String toName;
    private String toPhone;
    private String toAddress;

    private UserCreateRespone createdBy; // Người lập phiếu
    private UserCreateRespone assignedPicker; // Nhân viên lấy hàng

    private LocalDateTime createdDate;

    private List<OutboundDetailResponse> details;

}
