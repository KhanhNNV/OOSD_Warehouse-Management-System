package edu.uth.wms.dto.request;

import edu.uth.wms.model.enums.CustomerType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;
import jakarta.validation.constraints.Pattern;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CustomerRequest {

    private Long id; // ID khách hàng
    @NotBlank(message = "Tên khách hàng không được để trống")
    private String name;

    private String companyName;

    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại phải có 10-11 chữ số")
    private String phone;

    @Email(message = "Email không đúng định dạng")
    private String email;
    private String address; // Địa chỉ
    private String taxCode; // Mã số thuế
    private CustomerType customerType = CustomerType.RETAIL;
    private Boolean isActive = true;
    private String notes;
}
