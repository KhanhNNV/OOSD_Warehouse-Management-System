package edu.uth.wms.dto.request;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PutAwayRequest {
    private Long productId;
    private Integer quantity;
    private String targetShelfCode; // Mã vạch của kệ (VD: A-01-01) quét được

    private LocalDate manufactureDate;
    private LocalDate expiryDate;
}
