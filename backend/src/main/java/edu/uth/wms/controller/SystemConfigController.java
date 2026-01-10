package edu.uth.wms.controller;

import edu.uth.wms.dto.request.UpdateAlgorithmRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.SystemConfigResponse;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * CONTROLLER QUẢN LÝ CẤU HÌNH HỆ THỐNG
 * CHỈ ADMIN MỚI TRUY CẬP ĐƯỢC
 */
@RestController
@RequestMapping("/api/system-config")
@RequiredArgsConstructor
public class SystemConfigController {

    private final ISystemConfigService configService;

    /**
     * 1. LẤY CẤU HÌNH HIỆN TẠI
     * 
     * GET /api/v1/system-config
     */
    @GetMapping
    public ResponseEntity<ApiResponse<SystemConfigResponse>> getCurrentConfig() {
        SystemConfigResponse config = configService.getCurrentConfig();
        
        return ResponseEntity.ok(ApiResponse.<SystemConfigResponse>builder()
            .status("success")
            .message("Lấy cấu hình thành công")
            .data(config)
            .build());
    }

    /**
     * 2. CẬP NHẬT THUẬT TOÁN XUẤT KHO (ADMIN ONLY)
     * 
     * PUT /api/v1/system-config/algorithm
     * 
     * Body:
     * {
     *   "algorithm": "FEFO"
     * }
     */
    @PutMapping("/algorithm")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SystemConfigResponse>> updateAlgorithm(
        @RequestBody UpdateAlgorithmRequest request
    ) {
        String username = SecurityUtils.getCurrentUserLogin();
        SystemConfigResponse updated = configService.updateAlgorithm(username, request);
        
        return ResponseEntity.ok(ApiResponse.<SystemConfigResponse>builder()
            .status("success")
            .message("Cập nhật thuật toán thành công")
            .data(updated)
            .build());
    }
}