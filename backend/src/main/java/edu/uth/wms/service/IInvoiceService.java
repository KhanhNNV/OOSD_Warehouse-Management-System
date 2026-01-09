package edu.uth.wms.service;

import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.model.Invoice;

public interface IInvoiceService {
    Invoice createInvoiceFromOrder(InvoiceCreateRequest request);
}
