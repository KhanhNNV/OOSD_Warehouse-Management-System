package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.model.Invoice;
import edu.uth.wms.service.IInvoiceService; // Import Interface
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    // API: Lấy chi tiết hóa đơn (Đã sửa lại gọi Service)
    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceDetail(@PathVariable Long id) {
        // Gọi Service xử lý
        Invoice invoice = invoiceService.getInvoiceById(id);
        return ResponseEntity.ok(invoice);
    }
    // --- 3. THÊM MỚI: Lấy danh sách tất cả hóa đơn ---
    // URL: GET /api/invoices
    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }
}