package edu.uth.wms.dto.response;
import java.time.LocalDate;

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
    private String productUnit;
    // Thông tin vị trí
    private String locationCode;
    private LocalDate productEXD;
    

}