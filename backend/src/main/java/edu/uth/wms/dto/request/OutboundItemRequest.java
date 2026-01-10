// backend/src/main/java/edu/uth/wms/dto/request/OutboundItemRequest.java
package edu.uth.wms.dto.request;

import lombok.*;

// ========================================
// 2. CHI TIẾT SẢN PHẨM TRONG ĐƠN
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class OutboundItemRequest {
    private Long productId;
    private Integer requestedQty;
}
