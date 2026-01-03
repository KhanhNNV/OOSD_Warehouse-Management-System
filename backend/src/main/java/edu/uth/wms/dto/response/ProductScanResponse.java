package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder

public class ProductScanResponse {
    private String productId;    
    private String sku;
    private String productName;  
    private String imageProduct; 
    private String barcode;
    private String unit;
}
