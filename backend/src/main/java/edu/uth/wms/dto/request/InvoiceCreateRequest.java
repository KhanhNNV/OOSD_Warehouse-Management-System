package edu.uth.wms.dto.request;
import edu.uth.wms.model.enums.PaymentMethod;
import lombok.Data;

@Data
public class InvoiceCreateRequest {

    // Quan trọng nhất: ID của đơn hàng xuất (OutboundOrder)
    // Để hệ thống biết đang tạo hóa đơn cho đơn hàng nào
    private Long outboundOrderId;

    // Ghi chú thêm của kế toán (nếu có)
    private String note;
}