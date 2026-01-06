package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.model.InboundNote;
import edu.uth.wms.model.PurchaseOrder;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.service.IInboundService;
import edu.uth.wms.service.IPurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inbound")
public class InboundController {

    @Autowired
    private IInboundService inboundService;
    @Autowired
    private IPurchaseOrderService purchaseOrderService;

    // 1. API cho NHÂN VIÊN (Gửi kết quả kiểm đếm)
    // Dev 5 sẽ gọi cái này
    @PostMapping("/purchase-orders/{poId}/submit")
    public ResponseEntity<ApiResponse<InboundNote>> submitInboundResult(
            @PathVariable Long poId,
            @RequestBody List<InboundSubmitRequest> requestItems) {

        InboundNote result = inboundService.processInboundResult(poId, requestItems);

        return ResponseEntity.ok(
                ApiResponse.<InboundNote>builder()
                        .status("success")
                        .message("So sánh hoàn tất. Kiểm tra chi tiết bên dưới.")
                        .data(result)
                        .build()
        );
    }

    // ==================================================================
    // 2. API cho MANAGER (Duyệt đơn lệch) - BẠN BỔ SUNG ĐOẠN NÀY VÀO
    // ==================================================================
    @PutMapping("/purchase-orders/{poId}/approve")
    public ResponseEntity<ApiResponse<InboundNote>> approveInboundDifference(@PathVariable Long poId) {

        // Gọi Service xử lý duyệt
        InboundNote result = inboundService.approveInboundDifference(poId);

        return ResponseEntity.ok(
                ApiResponse.<InboundNote>builder()
                        .status("success")
                        .message("Đã duyệt nhập kho thành công (Trạng thái: COMPLETED).")
                        .data(result)
                        .build()
        );
    }
    // ==================================================================
    // 3. API LẤY DANH SÁCH PO (Frontend đang gọi cái này mà chưa có nè)
    // ==================================================================
    @GetMapping("/purchase-orders")
    public ResponseEntity<List<PurchaseOrderResponse>> getAllPOs() {
        return ResponseEntity.ok(purchaseOrderService.getAllPurchaseOrders());
    }


    @PostMapping("/manager/cancel/{poId}") // API Hủy đơn
    public ResponseEntity<?> cancelInbound(@PathVariable Long poId,
                                           @RequestParam(required = false) String reason) {
        try {
            inboundService.cancelInbound(poId, reason);
            return ResponseEntity.ok("Đã hủy đơn nhập hàng và PO thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
    @GetMapping("/purchase-orders/{poId}/pending-details")
    public ResponseEntity<ApiResponse<InboundNote>> getPendingInboundDetails(@PathVariable Long poId) {

        // Gọi Service (Service sẽ tự ném lỗi ResourceNotFoundException nếu không thấy)
        InboundNote note = inboundService.getPendingInboundNote(poId);

        return ResponseEntity.ok(
                ApiResponse.<InboundNote>builder()
                        .status("success")
                        .data(note)
                        .build()
        );
    }
    // ==================================================================
    // 4. API LẤY CHI TIẾT 1 PO (QUAN TRỌNG - BẠN ĐANG THIẾU CÁI NÀY)
    // ==================================================================
    @GetMapping("/purchase-orders/{id}")
    public ResponseEntity<?> getPODetail(@PathVariable Long id) {
        try {
            // Gọi service tìm PO theo ID
            // Lưu ý: Đảm bảo trong Service bạn đã viết hàm findById nhé
            PurchaseOrder po = purchaseOrderService.findById(id);
            return ResponseEntity.ok(po);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Lỗi: " + e.getMessage());
        }
    }
}