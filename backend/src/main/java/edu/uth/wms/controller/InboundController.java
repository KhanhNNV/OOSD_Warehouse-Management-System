package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InboundNoteRequest;
import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.InboundNoteResponse;
import edu.uth.wms.dto.response.PurchaseOrderForStaffResponse;
import edu.uth.wms.model.InboundNote;
import edu.uth.wms.service.IInboundService;
import edu.uth.wms.service.IPurchaseOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inbound")
public class InboundController {

    @Autowired
    private IInboundService inboundService;

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER')")
    public ResponseEntity<List<InboundNoteResponse>> getAllInboundNotes(){
        return ResponseEntity.ok(inboundService.getAlls());
    }


    @PostMapping("/{id}")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER')")
    public ResponseEntity<InboundNoteResponse> createInboundNote(@PathVariable Long id){
        return ResponseEntity.ok(inboundService.createInboundNote(id));
    }

    @GetMapping("/my-notes")
    @PreAuthorize("hasAnyRole('STAFF')")
    public ResponseEntity<List<InboundNoteResponse>> getMyInboundNotes() {
        return ResponseEntity.ok(inboundService.getMyInboundNotes());
    }

    @PostMapping("/{poId}/report")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<InboundNoteResponse> submitIbnoteReport(@PathVariable Long poId,
                                                                  @RequestBody List<InboundSubmitRequest> requestItems){
        return ResponseEntity.ok(inboundService.submitIbnoteReport(poId,requestItems));
    }


    // API Duyệt phiếu nhập
    // PUT /api/inbound/{id}/approve
    @PutMapping("/{id}/approve")
    public ResponseEntity<InboundNoteResponse> approveInboundNote(@PathVariable Long id) {
        return ResponseEntity.ok(inboundService.approveInboundNote(id));
    }

    // API Từ chối phiếu nhập (Không cần body json nữa)
    // PUT /api/inbound/{id}/reject
    @PutMapping("/{id}/reject")
    public ResponseEntity<InboundNoteResponse> rejectInboundNote(@PathVariable Long id) {
        return ResponseEntity.ok(inboundService.rejectInboundNote(id));
    }



    // 1. API cho NHÂN VIÊN (Gửi kết quả kiểm đếm)
    // Dev 5 sẽ gọi cái này
    @PostMapping("/{poId}/submit")
    @PreAuthorize("hasAnyRole('STAFF','MANAGER')")
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
//    @PutMapping("/{poId}/approve")
//    public ResponseEntity<ApiResponse<InboundNote>> approveInboundDifference(@PathVariable Long poId) {
//
//        // Gọi Service xử lý duyệt
//        InboundNote result = inboundService.approveInboundDifference(poId);
//
//        return ResponseEntity.ok(
//                ApiResponse.<InboundNote>builder()
//                        .status("success")
//                        .message("Đã duyệt nhập kho thành công (Trạng thái: COMPLETED).")
//                        .data(result)
//                        .build()
//        );
//    }




    @PostMapping("/manager/cancel/{id}") // API Hủy đơn
    public ResponseEntity<?> cancelInbound(@PathVariable Long poId,
                                           @RequestParam(required = false) String reason) {
        try {
            inboundService.cancelInbound(poId, reason);
            return ResponseEntity.ok("Đã hủy đơn nhập hàng và PO thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


}