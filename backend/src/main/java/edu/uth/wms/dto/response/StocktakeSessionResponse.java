package edu.uth.wms.dto.response;

import lombok.*;


// ========================================
// 1. RESPONSE CHO DANH SÁCH PHIÊN KIỂM
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeSessionResponse {
    
    private Long id;
    private String code;
    private String status;
    private String zoneCode;
    
    // Thống kê
    private Integer totalItems;      // Tổng số sản phẩm cần kiểm
    private Integer countedItems;    // Số đã đếm
    private Integer varianceCount;   // Số có chênh lệch
    
    // Thời gian
    private String startedAt;
    private String completedAt;
    
    // Người tạo
    private String createdBy;
}