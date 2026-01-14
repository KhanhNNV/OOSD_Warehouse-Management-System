package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InboundResultDetail {
    private String productId;
    private String productName;
    private String sku;
    private boolean isValid;
    private String message;
}