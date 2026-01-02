package edu.uth.wms.controller;

import edu.uth.wms.dto.request.SupplierRequest;
import edu.uth.wms.dto.response.SupplierResponse;
import edu.uth.wms.service.ISupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers") // Endpoint gốc cho nhà cung cấp
@RequiredArgsConstructor
public class SupplierController {

    private final ISupplierService supplierService;

    // GET /api/suppliers
    @GetMapping
    public ResponseEntity<List<SupplierResponse>> getAll() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    // POST /api/suppliers
    @PostMapping
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest dto) {
        SupplierResponse created = supplierService.createSupplier(dto);
        // Trả về code 201 (Created) thay vì 200 (OK)
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // PUT /api/suppliers/{id}
    @PutMapping("/{id}")
    public ResponseEntity<SupplierResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest dto) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, dto));
    }

    // DELETE /api/suppliers/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        // Trả về 204 No Content (Thành công nhưng không có body trả về)
        return ResponseEntity.noContent().build();
    }
}