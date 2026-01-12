package edu.uth.wms.dto.response;

import java.time.LocalDateTime;
import java.util.List;

import edu.uth.wms.model.enums.CustomerType;
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
public class CustomerResponse {

    private Long id; // ID khách hàng
    private String name; // Tên khách hàng
    private String companyName; // Tên công ty
    private String phone; // Số điện thoại
    private String email; // Email
    private String address; // Địa chỉ
    private String taxCode; // Mã số thuế
    private CustomerType customerType; // Loại khách hàng
    private Boolean isActive; // Trạng thái hoạt động
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
    private String createdByName;
    private String notes;

    // Có thể thêm danh sách đơn xuất kho nếu cần hiển thị
    private List<OutboundOrderResponse> outboundOrders;

}
