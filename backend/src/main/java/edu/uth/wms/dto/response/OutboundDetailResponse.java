package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class OutboundDetailResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String unit;
    private Integer requested_qty;

    // Thêm location của Thiên vào đây Int hay String ?
}
