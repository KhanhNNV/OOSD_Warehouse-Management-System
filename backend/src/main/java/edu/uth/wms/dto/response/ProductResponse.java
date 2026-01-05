package edu.uth.wms.dto.response;

import java.math.BigDecimal;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ProductResponse {
    private Long id;
    private String sku;
    private String barcode;
    private String name;
    private String imageUrl;
    private String unit;
    private BigDecimal price;
    private Long categoryId; // hoặc có thể trả về CategoryResponse nếu muốn chi tiết
    private String categoryName;

}