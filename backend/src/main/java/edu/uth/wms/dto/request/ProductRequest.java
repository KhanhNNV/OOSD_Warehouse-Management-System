package edu.uth.wms.dto.request;

import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {
    private String sku;
    private String barcode;
    private String name;
    private String imageUrl;
    private String unit;
    private BigDecimal price;
    private Long categoryId; // chỉ cần id của category để map
}