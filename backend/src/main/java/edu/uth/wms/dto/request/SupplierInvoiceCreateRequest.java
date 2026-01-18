package edu.uth.wms.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class SupplierInvoiceCreateRequest {

    // Kế toán chọn: "Tôi muốn trả tiền cho phiếu nhập kho nào?"
    @NotNull(message = "Vui lòng chọn Phiếu nhập kho cần thanh toán")
    private Long inboundNoteId;

    // Số hóa đơn đỏ trên giấy (NCC gửi)
    @NotBlank(message = "Số hóa đơn nhà cung cấp không được để trống")
    private String invoiceNumber;

    // Hạn chót phải trả tiền (Optional, nếu không điền thì tính default)
    private LocalDateTime dueDate;
}