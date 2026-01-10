package edu.uth.wms.controller;

import java.util.List;

import org.springframework.http.ResponseEntity; // Nhớ import cái này
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import edu.uth.wms.dto.request.CategoryRequest;
import edu.uth.wms.dto.response.CategoryResponse;
import edu.uth.wms.service.ICategoryService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final ICategoryService categoryService;

    @GetMapping
    // SỬA: Dùng hasAnyRole
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER', 'STAFF')")
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        // Bọc vào ResponseEntity.ok() cho chuẩn
        return ResponseEntity.ok(categoryService.getAllCategories());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryRequest dto) {
        return ResponseEntity.ok(categoryService.createCategory(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CategoryResponse> updateCategory(@PathVariable Long id, @RequestBody CategoryRequest dto) {
        return ResponseEntity.ok(categoryService.updateCategory(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
    }
}