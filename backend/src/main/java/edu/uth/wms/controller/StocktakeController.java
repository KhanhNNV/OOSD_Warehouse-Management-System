package edu.uth.wms.controller;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.service.IStocktakeService;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CONTROLLER KIỂM KÊ KHO
 */
@RestController
@RequestMapping("/api/stocktake")
@RequiredArgsConstructor
public class StocktakeController {

    private final IStocktakeService stocktakeService;

    // =================================================================
    // 1. LẤY TẤT CẢ PHIÊN KIỂM KÊ
    // =================================================================
    /**
     * GET /api/stocktake/sessions
     * 
     * Response:
     * {
     *   "status": "success",
     *   "data": [
     *     {
     *       "id": 1,
     *       "code": "ST-001",
     *       "status": "IN_PROGRESS",
     *       "totalItems": 50,
     *       "countedItems": 30,
     *       "varianceCount": 5
     *     }
     *   ]
     * }
     */
    @GetMapping("/sessions")
    @PreAuthorize("hasAnyRole('MANAGER', 'STAFF', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StocktakeSessionResponse>>> getAllSessions() {
        List<StocktakeSessionResponse> sessions = stocktakeService.getAllSessions();
        
        return ResponseEntity.ok(ApiResponse.<List<StocktakeSessionResponse>>builder()
            .status("success")
            .message("Lấy danh sách phiên kiểm kê thành công")
            .data(sessions)
            .build());
    }

    // =================================================================
    // 2. LẤY CHI TIẾT PHIÊN KIỂM (Manager xem)
    // =================================================================
    /**
     * GET /api/stocktake/sessions/{id}
     */
    @GetMapping("/sessions/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StocktakeSessionDetailResponse>> getSessionDetail(
        @PathVariable Long id
    ) {
        StocktakeSessionDetailResponse detail = stocktakeService.getSessionDetail(id);
        
        return ResponseEntity.ok(ApiResponse.<StocktakeSessionDetailResponse>builder()
            .status("success")
            .message("Lấy chi tiết phiên kiểm kê thành công")
            .data(detail)
            .build());
    }

    // =================================================================
    // 3. TẠO PHIÊN KIỂM KÊ MỚI (Manager)
    // =================================================================
    /**
     * POST /api/stocktake/sessions
     * 
     * Body:
     * {
     *   "type": "ZONE",
     *   "zoneCode": "A"
     * }
     */
    @PostMapping("/sessions")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StocktakeSessionResponse>> createSession(
        @RequestBody CreateStocktakeRequest request
    ) {
        String username = SecurityUtils.getCurrentUserLogin();
        StocktakeSessionResponse session = stocktakeService.createSession(username, request);
        
        return ResponseEntity.ok(ApiResponse.<StocktakeSessionResponse>builder()
            .status("success")
            .message("Tạo phiên kiểm kê thành công")
            .data(session)
            .build());
    }

    // =================================================================
    // 4. XÓA PHIÊN KIỂM KÊ
    // =================================================================
    /**
     * DELETE /api/stocktake/sessions/{id}
     */
    @DeleteMapping("/sessions/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
        @PathVariable Long id
    ) {
        stocktakeService.deleteSession(id);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .status("success")
            .message("Xóa phiên kiểm kê thành công")
            .build());
    }

    // =================================================================
    // 5. MỞ PHIÊN KIỂM KÊ (DRAFT → IN_PROGRESS)
    // =================================================================
    /**
     * POST /api/stocktake/sessions/{id}/open
     */
    @PostMapping("/sessions/{id}/open")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StocktakeSessionResponse>> openSession(
        @PathVariable Long id
    ) {
        StocktakeSessionResponse session = stocktakeService.openSession(id);
        
        return ResponseEntity.ok(ApiResponse.<StocktakeSessionResponse>builder()
            .status("success")
            .message("Đã mở phiên kiểm kê")
            .data(session)
            .build());
    }

    // =================================================================
    // 6. ĐÓNG PHIÊN KIỂM KÊ (IN_PROGRESS → COMPLETED)
    // =================================================================
    /**
     * POST /api/stocktake/sessions/{id}/close
     */
    @PostMapping("/sessions/{id}/close")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StocktakeSessionResponse>> closeSession(
        @PathVariable Long id
    ) {
        StocktakeSessionResponse session = stocktakeService.closeSession(id);
        
        return ResponseEntity.ok(ApiResponse.<StocktakeSessionResponse>builder()
            .status("success")
            .message("Đã đóng phiên kiểm kê")
            .data(session)
            .build());
    }

    // =================================================================
    // 10. LẤY BÁO CÁO CHÊNH LỆCH (Manager)
    // =================================================================
    /**
     * GET /api/stocktake/sessions/{id}/variance-report
     * 
     * Response:
     * {
     *   "sessionId": 1,
     *   "sessionCode": "ST-001",
     *   "variances": [
     *     {
     *       "productSku": "LAP001",
     *       "systemQty": 10,
     *       "actualQty": 8,
     *       "variance": -2
     *     }
     *   ],
     *   "totalVarianceItems": 5,
     *   "totalShortage": 10,
     *   "totalOverage": 3
     * }
     */
    @GetMapping("/sessions/{id}/variance-report")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<VarianceReportResponse>> getVarianceReport(
        @PathVariable Long id
    ) {
        VarianceReportResponse report = stocktakeService.getVarianceReport(id);
        
        return ResponseEntity.ok(ApiResponse.<VarianceReportResponse>builder()
            .status("success")
            .message("Lấy báo cáo chênh lệch thành công")
            .data(report)
            .build());
    }

    // =================================================================
    // 11. MANAGER DUYỆT ĐIỀU CHỈNH TỒN KHO
    // =================================================================
    /**
     * POST /api/stocktake/approve-adjustment
     * 
     * Body:
     * {
     *   "sessionId": 1
     * }
     */
    @PostMapping("/approve-adjustment")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<StocktakeSessionResponse>> approveAdjustment(
        @RequestBody ApproveAdjustmentRequest request
    ) {
        String username = SecurityUtils.getCurrentUserLogin();
        StocktakeSessionResponse session = stocktakeService.approveAdjustment(username, request);
        
        return ResponseEntity.ok(ApiResponse.<StocktakeSessionResponse>builder()
            .status("success")
            .message("Đã duyệt điều chỉnh tồn kho")
            .data(session)
            .build());
    }

    // =================================================================
    // 12. YÊU CẦU KIỂM LẠI
    // =================================================================
    /**
     * POST /api/stocktake/details/{detailId}/recount
     */
    @PostMapping("/details/{detailId}/recount")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> requestRecount(
        @PathVariable Long detailId,
        @RequestParam(required = false) String notes
    ) {
        stocktakeService.requestRecount(detailId, notes);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .status("success")
            .message("Đã yêu cầu kiểm lại")
            .build());
    }

    // =================================================================
    // 13. LẤY DANH SÁCH VIỆC CHO STAFF
    // =================================================================
    @GetMapping("/assignments")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StocktakeShelfAssignmentResponse>>> getStaffAssignments() {
        String username = SecurityUtils.getCurrentUserLogin();
        List<StocktakeShelfAssignmentResponse> assignments = stocktakeService.getStaffAssignments(username);
        return ResponseEntity.ok(ApiResponse.<List<StocktakeShelfAssignmentResponse>>builder()
            .status("success")
            .message("Lấy danh sách việc thành công")
            .data(assignments)
            .build());
    }

    //=================================================================
    // 14. BẮT ĐẦU ĐẾM KỆ
    // =================================================================
    @PostMapping("/assignments/{id}/start")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<StocktakeBlindCountResponse>>> startAssignment(@PathVariable Long id) {
        String username = SecurityUtils.getCurrentUserLogin();
        List<StocktakeBlindCountResponse> details = stocktakeService.startAssignment(username, id);
        return ResponseEntity.ok(ApiResponse.<List<StocktakeBlindCountResponse>>builder()
            .status("success")
            .message("Bắt đầu đếm kệ thành công")
            .data(details)
            .build());
    }

    // =================================================================
    // 15. HOÀN TẤT KỆ
    // =================================================================
    @PostMapping("/assignments/{id}/complete")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> completeAssignment(
        @PathVariable Long id,
        @RequestBody SubmitCountsRequest request) 
    {
        String username = SecurityUtils.getCurrentUserLogin();
        stocktakeService.completeAssignment(username, id, request);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .status("success")
            .message("Hoàn tất nhiệm vụ thành công")
            .build());
    }

}



    // // =================================================================
    // // 7. LẤY DANH SÁCH CHO STAFF (BLIND COUNT)
    // // =================================================================
    // /**
    //  * GET /api/stocktake/sessions/{id}/blind-count
    //  * 
    //  * Response không hiện systemQtySnapshot
    //  */
    // @GetMapping("/sessions/{id}/blind-count")
    // @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    // public ResponseEntity<ApiResponse<List<StocktakeBlindCountResponse>>> getBlindCountList(
    //     @PathVariable Long id
    // ) {
    //     List<StocktakeBlindCountResponse> items = stocktakeService.getBlindCountList(id);
        
    //     return ResponseEntity.ok(ApiResponse.<List<StocktakeBlindCountResponse>>builder()
    //         .status("success")
    //         .message("Lấy danh sách kiểm kê thành công")
    //         .data(items)
    //         .build());
    // }

    // // =================================================================
    // // 8. STAFF NHẬP SỐ LƯỢNG (1 SẢN PHẨM)
    // // =================================================================
    // /**
    //  * POST /api/stocktake/count
    //  * 
    //  * Body:
    //  * {
    //  *   "detailId": 1,
    //  *   "actualQty": 10
    //  * }
    //  */
    // @PostMapping("/count")
    // @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    // public ResponseEntity<ApiResponse<StocktakeDetailResponse>> submitCount(
    //     @RequestBody CountStocktakeItemRequest request
    // ) {
    //     String username = SecurityUtils.getCurrentUserLogin();
    //     StocktakeDetailResponse result = stocktakeService.submitCount(username, request);
        
    //     return ResponseEntity.ok(ApiResponse.<StocktakeDetailResponse>builder()
    //         .status("success")
    //         .message("Đã lưu số lượng kiểm")
    //         .data(result)
    //         .build());
    // }

    // // =================================================================
    // // 9. STAFF SUBMIT NHIỀU SẢN PHẨM
    // // =================================================================
    // /**
    //  * POST /api/stocktake/count-batch
    //  * 
    //  * Body:
    //  * {
    //  *   "sessionId": 1,
    //  *   "counts": [
    //  *     { "detailId": 1, "actualQty": 10 },
    //  *     { "detailId": 2, "actualQty": 5 }
    //  *   ]
    //  * }
    //  */
    // @PostMapping("/count-batch")
    // @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    // public ResponseEntity<ApiResponse<List<StocktakeDetailResponse>>> submitCounts(
    //     @RequestBody SubmitCountsRequest request
    // ) {
    //     String username = SecurityUtils.getCurrentUserLogin();
    //     List<StocktakeDetailResponse> results = stocktakeService.submitCounts(username, request);
        
    //     return ResponseEntity.ok(ApiResponse.<List<StocktakeDetailResponse>>builder()
    //         .status("success")
    //         .message("Đã lưu " + results.size() + " sản phẩm")
    //         .data(results)
    //         .build());
    // }
