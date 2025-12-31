package edu.uth.wms.dto.response;

import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {
    private Long id;
    private String sku;
    private String barcode;
    private String name;
    private String imageUrl;
    private String unit;
    private BigDecimal price;
    private Long categoryId; // hoặc có thể trả về CategoryResponse nếu muốn chi tiết
}