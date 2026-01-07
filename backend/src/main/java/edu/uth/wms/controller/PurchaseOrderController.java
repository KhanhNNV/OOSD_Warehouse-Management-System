package edu.uth.wms.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.service.IPurchaseOrderService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/purchase-order") // Gom nhóm API nhập kho
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final IPurchaseOrderService poService;
    
    // 1. Upload Excel tạo Đơn nhập hàng
    // URL: POST /api/inbound/po/upload-excel
    @PostMapping(value = "/upload-excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<PurchaseOrderResponse> createPo(@RequestParam("file") MultipartFile file,
            @RequestParam("supplierId") Long supplierId) {
        PurchaseOrderResponse response = poService.createPoFromExcel(file, supplierId);
        return ResponseEntity.ok(response);
    }

    // 2. Lấy danh sách PO
    // URL: GET /api/inbound/po
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<PurchaseOrderResponse>> getAllPOs() {
        return ResponseEntity.ok(poService.getAllPurchaseOrders());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<PurchaseOrderResponse> getPurchaseOrderById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPurchaseOrderById(id));
    }



}