package edu.uth.wms.dto.response;

import edu.uth.wms.model.enums.InvoiceStatus; // Nhớ import Enum này
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class SupplierInvoiceResponse {
    private Long id;
    private String invoiceNumber; // Số hóa đơn đỏ

    private String inboundNoteCode; // Mã phiếu nhập (Để biết trả cho lô nào)
    private String supplierName;    // Tên NCC

    private BigDecimal totalAmount; // Tổng tiền hàng
    private BigDecimal taxAmount;   // Thuế
    private BigDecimal finalAmount; // Tổng thanh toán

    private InvoiceStatus status;   // Trạng thái (Chưa trả/Đã trả)

    private LocalDateTime createdAt;
    private LocalDateTime dueDate;
    private String createdByName;

    // Danh sách chi tiết
    private List<SupplierInvoiceDetailResponse> details;
}