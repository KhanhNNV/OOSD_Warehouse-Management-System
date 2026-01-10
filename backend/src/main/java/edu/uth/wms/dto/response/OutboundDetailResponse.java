package edu.uth.wms.dto.response;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
// ========================================
// 2. CHI TIẾT SẢN PHẨM TRONG ĐƠN
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class OutboundDetailResponse {
    private Long productId;
    private String productSku;
    private String productName;
    private Integer requestedQty;
    private Integer allocatedQty; // Số lượng đã phân bổ
}
