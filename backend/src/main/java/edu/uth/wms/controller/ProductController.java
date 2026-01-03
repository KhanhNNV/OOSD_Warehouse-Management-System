package edu.uth.wms.controller;

import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.model.Products;
import edu.uth.wms.service.IProductService;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/products")
public class ProductController {
    private final IProductService productService;
    
    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<?> getProductByBarcode(@PathVariable String barcode) {
        Optional<ProductScanResponse> productScan = productService.getProductByBarcode(barcode);

        if (productScan.isPresent()) {
            return ResponseEntity.ok(productScan.get());
        } else {
            return ResponseEntity.status(404).body("Not found product");
        }
    }
}
