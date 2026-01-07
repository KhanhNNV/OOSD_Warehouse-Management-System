package edu.uth.wms.dto.response;

import java.util.List;

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
    private String phone; // Số điện thoại
    private String email; // Email
    private String address; // Địa chỉ

    // Có thể thêm danh sách đơn xuất kho nếu cần hiển thị
    private List<OutboundOrderResponse> outboundOrders;

}
