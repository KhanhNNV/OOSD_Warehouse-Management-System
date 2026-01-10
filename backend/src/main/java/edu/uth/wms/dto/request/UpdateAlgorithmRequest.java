package edu.uth.wms.dto.request;

import lombok.*;

import java.util.List;

// ========================================
// 5. CẬP NHẬT CẤU HÌNH THUẬT TOÁN (ADMIN)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAlgorithmRequest {
    /**
     * Thuật toán mới: "FIFO" hoặc "FEFO"
     */
    private String algorithm; // FIFO hoặc FEFO
}