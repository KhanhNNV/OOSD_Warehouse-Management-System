package edu.uth.wms.dto.request;

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
public class OutboundOrderRequest {

    private String orderNumber;        // Mã phiếu xuất kho
    private Long customerId;           // Khách hàng
    private String toName;             // Người nhận hàng
    private String toPhone;            // SĐT người nhận
    private String toAddress;          // Địa chỉ giao hàng
    private Long createdByUserId;      // Người lập phiếu
    private Long assignedPickerUserId; // Nhân viên lấy hàng

    private List<OutboundDetailRequest> details; // Danh sách sản phẩm

}
