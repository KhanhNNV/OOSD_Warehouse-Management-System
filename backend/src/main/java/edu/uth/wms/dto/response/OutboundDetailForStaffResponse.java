package edu.uth.wms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OutboundDetailForStaffResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private String unit;
    private Integer requested_qty;

    // // --- THÊM 2 TRƯỜNG NÀY ---
    private Long recommendedLocationId;     // ID vị trí gợi ý
    private String recommendedLocationCode;

    // Thêm location của Thiên vào đây Int hay String ?
}