package edu.uth.wms.dto.request;
import lombok.*;

// ========================================
// 2. STAFF NHẬP SỐ LƯỢNG KIỂM (BLIND COUNT)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CountStocktakeItemRequest {
    
    /**
     * ID của chi tiết cần cập nhật
     */
    private Long detailId;
    
    /**
     * Số lượng thực đếm
     */
    private Integer actualQty;
}
