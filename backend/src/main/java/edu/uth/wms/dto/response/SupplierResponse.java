package edu.uth.wms.dto.response;

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
public class SupplierResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;

    // Không trả về List<PurchaseOrder> ở đây.
    // Nếu Frontend cần xem lịch sử nhập hàng của NCC này,
    // họ sẽ gọi API riêng: GET /api/suppliers/{id}/purchase-orders
}
