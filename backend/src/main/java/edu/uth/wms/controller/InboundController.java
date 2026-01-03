package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.model.InboundNote;
import edu.uth.wms.service.IInboundService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inbound")
public class InboundController {

    @Autowired
    private IInboundService inboundService;

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
}