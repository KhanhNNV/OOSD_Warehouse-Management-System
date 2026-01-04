package edu.uth.wms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

// 1. Chi tiết từng dòng hàng (Dùng lồng trong PO Response)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PoDetailResponse {
    private Long id; // ID dòng chi tiết
    private Long productId; // ID sản phẩm
    private String productSku; // Hiển thị SKU cho dễ nhìn
    private String productName; // Hiển thị tên SP
    private Integer expectedQty; // Số lượng đặt
}
