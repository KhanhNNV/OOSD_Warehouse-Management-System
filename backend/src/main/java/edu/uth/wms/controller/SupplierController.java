package edu.uth.wms.controller;

import edu.uth.wms.dto.request.SupplierRequest;
import edu.uth.wms.dto.response.SupplierResponse;
import edu.uth.wms.service.ISupplierService;
import edu.uth.wms.service.utils.SecurityUtils;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
public class SupplierController {

    private final ISupplierService supplierService;

    // GET /api/suppliers
    @GetMapping
    // SỬA: Dùng hasAnyRole và thêm MANAGER cho chắc chắn
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<List<SupplierResponse>> getAll() {
        return ResponseEntity.ok(supplierService.getAllSuppliers());
    }

    // POST /api/suppliers
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierResponse> create(@Valid @RequestBody SupplierRequest dto) {
        SupplierResponse created = supplierService.createSupplier(dto);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    // PUT /api/suppliers/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SupplierResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody SupplierRequest dto) {
        return ResponseEntity.ok(supplierService.updateSupplier(id, dto));
    }

    // DELETE /api/suppliers/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        supplierService.deleteSupplier(id);
        return ResponseEntity.noContent().build();
    }
}