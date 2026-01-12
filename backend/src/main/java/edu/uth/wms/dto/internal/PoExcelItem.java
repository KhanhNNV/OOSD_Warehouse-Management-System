package edu.uth.wms.dto.internal; // Gói nội bộ

import lombok.Data;

@Data
public class PoExcelItem {
    private String productName;
    private String sku;
    private Integer quantity;
}