package edu.uth.wms.dto.response;

import lombok.*;


import java.util.List;
// ========================================
// 4. CHI TIẾT MỖI TASK LẤY HÀNG
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class PickingTaskResponse {
    private Long productId;
    private String productSku;
    private String productName;
    private Integer totalNeeded; // Tổng cần lấy
    
    /**
     * Danh sách kệ cần lấy (Đã sắp xếp theo thuật toán)
     */
    private List<LocationPickingDetail> locations;
}