package edu.uth.wms.dto.request;

import lombok.*;

// ========================================
// 4. CHI TIẾT MỖI LẦN STAFF SCAN
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class PickedItemDetail {
    private Long productId;
    private String locationCode; // Mã kệ (VD: A-01-01)
    private Integer quantity;
}