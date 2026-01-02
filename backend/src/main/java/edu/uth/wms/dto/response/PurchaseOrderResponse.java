package edu.uth.wms.dto.response;

import java.util.List;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

// 2. Response Tổng quan PO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PurchaseOrderResponse {
    private Long id;
    private String poNumber; // Số PO
    private String supplierName; // Tên NCC
    private String status; // NEW, APPROVED...
    private String expectedDate; // yyyy-MM-dd
    private Integer totalItems; // Tổng số mặt hàng (loại SP)
    private Integer totalQuantity;// Tổng số lượng chi tiết

    // List chi tiết (sẽ null nếu chỉ get danh sách tổng quan để nhẹ)
    private List<PoDetailResponse> details;
}