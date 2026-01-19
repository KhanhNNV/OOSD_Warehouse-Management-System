package edu.uth.wms.dto.response;
import lombok.*;
// ========================================
// 4. RESPONSE CHO STAFF (BLIND COUNT)
// Không hiển thị systemQtySnapshot
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeBlindCountResponse {
    
    private Long detailId;
    
    // Thông tin sản phẩm
    private Long productId;
    private String productSku;
    private String productName;
    private String productImage;
    // Thông tin vị trí
    private String locationCode;
    
    // Số lượng đã nhập (nếu có)
    private Integer actualCountedQty;
}