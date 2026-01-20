
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
   //// Này hữu dụng để mở rộng 
    /**
     * Loại kiểm: ZONE, CATEGORY, FULL
     */
    //private String type;
    /**
     * ID danh mục (nếu type = CATEGORY)
     */
    //private Long categoryId;
    /////////////////////////////////////////


    /**
     * Mã khu vực (nếu type = ZONE)
     * VD: "A" để kiểm tất cả kệ bắt đầu bằng "A-"
     */
    private String zoneCode;
}