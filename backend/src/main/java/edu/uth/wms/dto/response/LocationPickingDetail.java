package edu.uth.wms.dto.response;
import lombok.*;


// ========================================
// 5. CHI TIẾT TỪNG KỆ HÀNG
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class LocationPickingDetail {
    private Long inventoryId;
    private String locationCode; // A-01-01
    private Integer qtyToPickFromHere; // Lấy bao nhiêu từ kệ này
    private Integer availableQty; // Tồn kho hiện tại
    private String expiryDate; // Ngày hết hạn (nếu có)
    private String manufactureDate; // Ngày sản xuất (nếu có)
    private Integer pickedQty;
}