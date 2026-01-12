package edu.uth.wms.dto.internal;

import lombok.Data;

@Data
public class OutboundExcelItem {
    private String productName;
    private String sku;
    private int quantity;
}
