package edu.uth.wms.dto.response;

import lombok.*;

// ========================================
// 6. CHI TIẾT CHÊNH LỆCH
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VarianceItemResponse {

    private Long detailId;
    private Long productId;
    private String productSku;
    private String productName;
    private String productImage;
    private String productBarcode;
    private String locationCode;
    private String staffName;
    private Integer systemQty;
    private Integer actualQty;
    private Integer variance; // Dương = thừa, Âm = thiếu
}