package edu.uth.wms.controller;

import edu.uth.wms.dto.request.SkuZoneConfigRequest;
import edu.uth.wms.dto.response.SkuZoneConfigResponse;
import edu.uth.wms.service.ISkuZoneConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sku-zone-configs")
@RequiredArgsConstructor
public class SkuZoneConfigController {

    private final ISkuZoneConfigService service;

    // Lấy danh sách
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<List<SkuZoneConfigResponse>> getAllConfigs() {
        return ResponseEntity.ok(service.getAllConfigs());
    }

    // Lấy chi tiết
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<SkuZoneConfigResponse> getConfigById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getConfigById(id));
    }

    // Tạo mới
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SkuZoneConfigResponse> createConfig(@RequestBody SkuZoneConfigRequest request) {
        return ResponseEntity.ok(service.createConfig(request));
    }

    // Cập nhật
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SkuZoneConfigResponse> updateConfig(
            @PathVariable Long id,
            @RequestBody SkuZoneConfigRequest request) {
        return ResponseEntity.ok(service.updateConfig(id, request));
    }

    // Xóa
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteConfig(@PathVariable Long id) {
        service.deleteConfig(id);
        return ResponseEntity.ok("Đã xóa cấu hình thành công!");
    }
}