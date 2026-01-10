package edu.uth.wms.dto.response;

import lombok.*;

// ========================================
// 8. RESPONSE CẤU HÌNH HỆ THỐNG
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfigResponse {
    private String currentAlgorithm; // FIFO hoặc FEFO
    private String updatedBy;
    private String updatedAt;
}
