package edu.uth.wms.dto.response;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
// ========================================
// 7. CHI TIẾT SẢN PHẨM ĐÃ XUẤT
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public
class ExportedItemDetail {
    private String productName;
    private String locationCode;
    private Integer quantity;
}
