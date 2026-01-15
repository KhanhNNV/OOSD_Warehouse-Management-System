package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class BatchPickingErrorDetail {
    private Long productId;
    private Long locationId;
    private String productSku;
    private String locationCode;
    private Integer requestedQty; // Số lượng muốn lấy
    private Integer availableQty; // Số lượng thực tế trong kho (để biết thiếu bao nhiêu)
    private String errorMessage;
}
