package edu.uth.wms.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundSubmitRequest {
    private Long productId;
    private Integer actualQty;

    private LocalDate expiryDate;// ngày hết hạn
}