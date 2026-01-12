package edu.uth.wms.dto.response;

import lombok.*;
import java.math.BigDecimal; // Import thêm cái này
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundOrderResponse {

    private Long id;
    private String orderNumber;
    private String status;

    private String customerName;
    private String toName;
    private String toPhone;
    private String toAddress;


    private Integer totalItems;     // Tổng số loại sản phẩm
    private Integer totalQuantity;  // Tổng số lượng sản phẩm


    private BigDecimal totalAmount; // Tổng tiền (Quan trọng để hiển thị bảng hóa đơn)

    // Thời gian
    private LocalDateTime createdDate; // Sửa String thành LocalDateTime để dễ format hoặc giữ String tùy team bạn quy định


}