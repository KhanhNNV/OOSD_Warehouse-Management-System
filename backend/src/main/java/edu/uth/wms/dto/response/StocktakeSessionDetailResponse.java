package edu.uth.wms.dto.response;


import lombok.*;
import java.util.List;
// ========================================
// 2. RESPONSE CHI TIẾT PHIÊN KIỂM (Kèm danh sách)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeSessionDetailResponse {
    
    private Long id;
    private String code;
    private String status;
    
    // Thống kê
    private Integer totalItems;
    private Integer countedItems;
    private Integer varianceCount;
    
    // Thời gian
    private String startedAt;
    private String completedAt;
    
    /**
     * Danh sách chi tiết sản phẩm
     */
    private List<StocktakeDetailResponse> details;
}