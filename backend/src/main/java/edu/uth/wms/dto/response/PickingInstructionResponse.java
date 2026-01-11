package edu.uth.wms.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;





// ========================================
// 3. GỢI Ý KỆ HÀNG CHO STAFF (PICKING INSTRUCTION)
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PickingInstructionResponse {
    /**
     * ID đơn hàng
     */
    private Long orderId;
    private String orderNumber;
    
    /**
     * Thuật toán đang sử dụng
     */
    private String algorithm;
    
    /**
     * Danh sách chỉ dẫn lấy hàng
     */
    private List<PickingTaskResponse> tasks;
}



