package edu.uth.wms.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundDetailResponse {
    private Long id;

    private Integer actualQty;

    private String note;

    // --- RELATION DATA ---

    private Long productId;

    private String productName;
    private String productSku;
}
