package edu.uth.wms.dto.response;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import java.time.LocalDateTime;

// ========================================
// 2. CHI TIẾT SẢN PHẨM TRONG ĐƠN
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class OutboundDetailResponse {
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
    private Integer requestedQty; // Số lượng khách đặt
    private Integer pickupQty;     // Số lượng CẦN LẤY tại vị trí này
    private String unit;
    private String imageUrl;

    // // --- THÊM 2 TRƯỜNG NÀY ---
    private Long recommendedLocationId;     // ID vị trí gợi ý
    private String recommendedLocationCode;

}
