package edu.uth.wms.dto.request;
import lombok.*;

import java.util.List;

// ========================================
// 1. TẠO ĐơN HÀNG XUẤT MỚI
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderCreateRequest {
    
    private Long customerId; // ID khách hàng (nullable)
    
    // Thông tin giao hàng
    private String toName;
    private String toPhone;
    private String toAddress;
    
    // Danh sách sản phẩm cần xuất
    private List<OutboundItemRequest> items;
}

