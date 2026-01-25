package edu.uth.wms.dto.request;
import java.util.List;

import lombok.*;

// ========================================
// 3. SUBMIT NHIỀU SẢN PHẨM CÙNG LÚC
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitCountsRequest {
    
    /**
     * ID phiên kiểm
     */
    private Long assignmentId;
    
    /**
     * Danh sách đếm được của nhân viên
     */
    private List<CountStocktakeItemRequest> items;
}