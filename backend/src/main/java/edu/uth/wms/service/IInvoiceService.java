package edu.uth.wms.service;

import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.model.Invoice;

import java.util.List;

public interface IInvoiceService {
    Invoice createInvoiceFromOrder(InvoiceCreateRequest request);
    Invoice getInvoiceById(Long id);
    List<Invoice> getAllInvoices();
}
