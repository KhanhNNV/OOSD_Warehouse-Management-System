package edu.uth.wms.controller;

import edu.uth.wms.dto.request.SupplierInvoiceCreateRequest;
import edu.uth.wms.dto.response.SupplierInvoiceResponse;
import edu.uth.wms.service.ISupplierInvoiceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/supplier-invoices")
@RequiredArgsConstructor
public class SupplierInvoiceController {

    private final ISupplierInvoiceService supplierInvoiceService;


    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @PostMapping("/create")
    public ResponseEntity<SupplierInvoiceResponse> createInvoice(@RequestBody SupplierInvoiceCreateRequest request) {
        // 👇 GỌN GÀNG: Không cần truyền username, Service tự lo
        SupplierInvoiceResponse newInvoice = supplierInvoiceService.createInvoice(request);
        return ResponseEntity.ok(newInvoice);
    }

    // 2. API Lấy chi tiết hóa đơn (Để xem trong Modal)
    // URL: GET http://localhost:8080/api/supplier-invoices/{id}
    @GetMapping("/{id}")
    public ResponseEntity<SupplierInvoiceResponse> getInvoiceDetail(@PathVariable Long id) {
        SupplierInvoiceResponse invoice = supplierInvoiceService.getInvoiceById(id);
        return ResponseEntity.ok(invoice);
    }

    // 3. API Lấy danh sách lịch sử hóa đơn nhập
    // URL: GET http://localhost:8080/api/supplier-invoices
    @GetMapping
    public ResponseEntity<List<SupplierInvoiceResponse>> getAllInvoices() {
        List<SupplierInvoiceResponse> invoices = supplierInvoiceService.getAllInvoices();
        return ResponseEntity.ok(invoices);
    }
}