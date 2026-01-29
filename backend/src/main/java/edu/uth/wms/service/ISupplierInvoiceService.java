package edu.uth.wms.service;

import edu.uth.wms.dto.request.SupplierInvoiceCreateRequest;
import edu.uth.wms.dto.response.SupplierInvoiceResponse;

import java.util.List;

public interface ISupplierInvoiceService {
    // Hàm tạo hóa đơn (Cần username để biết ai tạo)
    SupplierInvoiceResponse createInvoice(SupplierInvoiceCreateRequest request);
    SupplierInvoiceResponse getInvoiceById(Long id);

    List<SupplierInvoiceResponse> getAllInvoices();

    void markAsPaid(Long id);
    byte[] exportPdf(Long id);
}