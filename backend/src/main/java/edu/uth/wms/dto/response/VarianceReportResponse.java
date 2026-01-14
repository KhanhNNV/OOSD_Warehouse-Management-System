package edu.uth.wms.dto.response;

import lombok.*;
import java.util.List;
// ========================================
// 5. BÁO CÁO CHÊNH LỆCH
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VarianceReportResponse {
    
    private Long sessionId;
    private String sessionCode;
    
    /**
     * Danh sách sản phẩm có chênh lệch
     */
    private List<VarianceItemResponse> variances;
    
    // Tổng hợp
    private Integer totalVarianceItems;  // Số sản phẩm lệch
    private Integer totalShortage;       // Tổng thiếu (tổng variance âm)
    private Integer totalOverage;        // Tổng thừa (tổng variance dương)
}
