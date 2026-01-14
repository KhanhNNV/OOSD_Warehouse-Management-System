package edu.uth.wms.dto.response;
import lombok.*;

// ========================================
// 3. RESPONSE CHI TIẾT SẢN PHẨM (Manager xem)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeDetailResponse {
    
    private Long id;
    
    // Thông tin sản phẩm
    private Long productId;
    private String productSku;
    private String productName;
    private String productImage;
    
    // Thông tin vị trí
    private Long locationId;
    private String locationCode;
    
    // Số lượng
    private Integer systemQtySnapshot;    // Số hệ thống
    private Integer actualCountedQty;     // Số thực đếm
    private Integer variance;             // Chênh lệch
}

