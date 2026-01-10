package edu.uth.wms.dto.request;
import lombok.*;

import java.util.List;

// ========================================
// 3. XÁC NHẬN XUẤT KHO (STAFF THỰC HIỆN)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConfirmPickingRequest {
    /**
     * ID của OutboundOrder cần xuất
     */
    private Long outboundOrderId;
    
    /**
     * Danh sách chi tiết: Lấy từ kệ nào, bao nhiêu
     * (Frontend gửi lên sau khi Staff scan xong)
     */
    private List<PickedItemDetail> pickedItems;
}
