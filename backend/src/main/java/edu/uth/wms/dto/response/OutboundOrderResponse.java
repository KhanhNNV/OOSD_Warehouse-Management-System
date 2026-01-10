package edu.uth.wms.dto.response;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

// ========================================
// 1. RESPONSE CHO DANH SÁCH ĐƠN HÀNG
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderResponse {
    private Long id;
    private String orderNumber;
    private String status;
    
    // Thông tin khách hàng
    private String customerName;
    private String toName;
    private String toPhone;
    private String toAddress;
    
    // Thống kê
    private Integer totalItems; // Tổng số loại sản phẩm
    private Integer totalQuantity; // Tổng số lượng
    
    // Thời gian
    private String createdDate;
    
    // Chi tiết sản phẩm
    private List<OutboundDetailResponse> details;
}
