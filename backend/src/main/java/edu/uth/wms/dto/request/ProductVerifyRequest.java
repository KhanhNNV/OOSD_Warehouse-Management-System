package edu.uth.wms.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProductVerifyRequest {
    private Long targetProductId; 
    private String scannedProductCode;   
}
