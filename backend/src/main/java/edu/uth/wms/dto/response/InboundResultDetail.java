package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class InboundResultDetail {
    private String productId;
    private boolean isValid;
    private String message;
}