
package edu.uth.wms.dto.request;

import lombok.*;

// ========================================
// 1. TẠO PHIÊN KIỂM KÊ MỚI
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateStocktakeRequest {
    
    /**
     * Loại kiểm: ZONE, CATEGORY, FULL
     */
    private String type;
    
    /**
     * Mã khu vực (nếu type = ZONE)
     * VD: "A" để kiểm tất cả kệ bắt đầu bằng "A-"
     */
    private String zoneCode;
    
    /**
     * ID danh mục (nếu type = CATEGORY)
     */
    private Long categoryId;
}