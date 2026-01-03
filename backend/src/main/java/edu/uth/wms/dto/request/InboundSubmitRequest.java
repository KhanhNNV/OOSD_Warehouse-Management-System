package edu.uth.wms.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundSubmitRequest {
    private Long productId;
    private Integer actualQty;
}