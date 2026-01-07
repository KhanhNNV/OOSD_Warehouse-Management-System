package edu.uth.wms.dto.request;

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
public class CustomerRequest {

    private Long id; // ID khách hàng
    private String name; // Tên khách hàng
    private String phone; // Số điện thoại (unique)
    private String email; // Email
    private String address; // Địa chỉ

}
