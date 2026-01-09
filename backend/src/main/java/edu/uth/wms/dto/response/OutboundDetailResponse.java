package edu.uth.wms.dto.response;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OutboundDetailResponse {
    private Long id;
    // Thông tin sản phẩm
    private String productName;
    private String productSku;
    private int requestedQty; // Số lượng yêu cầu
    private int allocatedQty; // Số lượng đã phân bổ (FIFO)

}
