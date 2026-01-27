package edu.uth.wms.dto.request;

import lombok.*;
import java.util.List;

/**
 * Request cho Manager duyệt và điều chỉnh tồn kho.
 * <p>
 * Chứa sessionId và danh sách adjustments (số lượng mới cho từng sản phẩm).
 * </p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveAdjustmentRequest {

    /**
     * ID phiên kiểm kê
     */
    private Long sessionId;

    /**
     * Danh sách các sản phẩm cần điều chỉnh với số lượng mới do Manager quyết định
     */
    private List<AdjustmentItem> adjustments;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdjustmentItem {
        /** ID của StocktakeDetail */
        private Long detailId;
        /** Số lượng mới do Manager quyết định */
        private Integer newQuantity;
    }
}
