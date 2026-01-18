package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SupplierInvoiceDetailResponse {
    private Long id;

    private Long productId;
    private String productSku;
    private String productName;

    private Integer quantity;       // Số lượng nhập thực tế
    private BigDecimal unitPrice;   // Giá nhập (Cost)
    private BigDecimal totalLineAmount; // Thành tiền (SL x Giá)
}