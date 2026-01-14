package edu.uth.wms.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InventoryResponse {
    private Long Id;
    private Long productId;
    private String name;
    private String barcode;
    private Integer quantity;
    private String image;
    private String sku;
}
