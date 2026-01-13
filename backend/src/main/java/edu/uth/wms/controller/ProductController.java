package edu.uth.wms.controller;

import java.util.List;
import java.util.Optional;

import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.dto.response.VerifyResponse;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.ProductRequest;
import edu.uth.wms.dto.request.ProductVerifyRequest;
import edu.uth.wms.dto.response.ProductResponse;
import edu.uth.wms.dto.response.ProductScanResponse;
import edu.uth.wms.service.IProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final IProductService productService;

    // 1. Lấy danh sách sản phẩm
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProductResponse>> getAllProducts() {
        return ResponseEntity.ok(productService.getAllProducts());
    }

    // Lấy sản phẩm theo ID
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ProductResponse> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    // 2. Lấy sản phẩm theo Category ID
    @GetMapping("/category/{categoryId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','STAFF')")
    public ResponseEntity<List<ProductResponse>> getProductsByCategory(@PathVariable Long categoryId) {
        return ResponseEntity.ok(productService.getProductsByCategory(categoryId));
    }

    // 3. Tạo sản phẩm mới (Có upload ảnh)
    // CONSUMES: multipart/form-data
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> createProduct(@Valid @ModelAttribute ProductRequest request, // Dùng
                                                                                                        // @ModelAttribute
                                                                                                        // để hứng text
                                                                                                        // fields từ
                                                                                                        // form-data
            @RequestPart(value = "image", required = false) MultipartFile imageFile // Hứng file ảnh
    ) {
        ProductResponse response = productService.createProduct(request, imageFile);
        return ResponseEntity.ok(response);
    }

    // 4. Import Excel
    @PostMapping(value = "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> importExcel(@RequestParam("file") MultipartFile file) {
        productService.importProductFromExcel(file);
        return ResponseEntity.ok("Import dữ liệu thành công!");
    }

    // 5. Cập nhật sản phẩm
    // Method PUT trong Spring Boot với Multipart khá phức tạp,
    // client (Frontend) cần gửi đúng định dạng form-data
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductResponse> updateProduct(@PathVariable Long id,
            @Valid @ModelAttribute ProductRequest request,
            @RequestPart(value = "image", required = false) MultipartFile imageFile) {
        ProductResponse response = productService.updateProduct(id, request, imageFile);
        return ResponseEntity.ok(response);
    }

    // 6. Xóa sản phẩm (Soft Delete hoặc Hard Delete tùy Service logic)
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.noContent().build(); // Trả về 204 No Content
    }

    @GetMapping("/barcode/{barcode}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<?> getProductByBarcode(@PathVariable String barcode) {
        Optional<ProductScanResponse> productScan = productService.getProductByBarcode(barcode);

        if (productScan.isPresent()) {
            return ResponseEntity.ok(productScan.get());
        } else {
            return ResponseEntity.status(404).body("Not found product");
        }
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<VerifyResponse> verifyProduct(@RequestBody ProductVerifyRequest request) {
        return ResponseEntity.ok(productService.verifyProductMatch(request));
    }


}