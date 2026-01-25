package edu.uth.wms.dto.request;

import java.time.LocalDate;

import lombok.Data;

@Data
public class PutAwayRequest {
    private Long productId;
    private Integer quantity;
    private String targetShelfCode; // Mã vạch của kệ (VD: A-01-01) quét được
    private LocalDate expiryDate;

    // ✅ NEW: Flag đánh dấu kệ đầy
    private Boolean markLocationFull = false; // Default = false
}
