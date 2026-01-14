package edu.uth.wms.dto.request;
import lombok.*;
// ========================================
// 4. MANAGER DUYỆT ĐIỀU CHỈNH
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveAdjustmentRequest {
    
    /**
     * ID phiên kiểm
     */
    private Long sessionId;
}
