package edu.uth.wms.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
public class OutboundOrderRequest {

    // private String orderNumber; // Mã phiếu xuất kho
    @NotNull(message = "Customer ID không được để trống")
    private Long customerId; // Khách hàng

    @NotBlank(message = "Tên người nhận không được để trống")
    private String toName; // Người nhận hàng

    @NotBlank(message = "Số điện thoại không được để trống")
    private String toPhone; // SĐT người nhận

    @NotBlank(message = "Địa chỉ không được để trống")
    private String toAddress; // Địa chỉ giao hàng
    // private Long createdByUserId; // Người lập phiếu
    // private Long assignedPickerUserId; // Nhân viên lấy hàng

    @NotEmpty(message = "Danh sách sản phẩm không được rỗng")
    @Valid
    private List<OutboundItemRequest> items; // Danh sách sản phẩm

}
