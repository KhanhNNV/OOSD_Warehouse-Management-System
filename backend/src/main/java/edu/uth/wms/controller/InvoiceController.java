package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.model.Invoice;
import edu.uth.wms.service.IInvoiceService; // Import Interface
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final IInvoiceService invoiceService;

    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<Invoice> createInvoice(@RequestBody InvoiceCreateRequest request) {
        Invoice newInvoice = invoiceService.createInvoiceFromOrder(request);
        return ResponseEntity.ok(newInvoice);
    }
}