package edu.uth.wms.controller;


import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundNoteResponse;
import edu.uth.wms.dto.response.OutboundOrderForStaffResponse;
import edu.uth.wms.exceptions.BatchPickingException;
import edu.uth.wms.service.IOutboundOrderForStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/outbound")
@RequiredArgsConstructor
public class OutboundOrderForStaffController {
    private final IOutboundOrderForStaffService outboundOrderService;

    // @GetMapping
    // public ResponseEntity<List<OutboundOrderForStaffResponse>> getAllOrders() {
    //     // Gọi Service và trả về luôn, không xử lý logic ở đây
    //     return ResponseEntity.ok(outboundOrderService.getAllOrders());
    // }

    @GetMapping("/{id}/details")
    public ResponseEntity<List<OutboundDetailResponse>> getOutboundDetails(@PathVariable Long id) {
        return ResponseEntity.ok(outboundOrderService.getOutboundDetails(id));
    }

@PostMapping("/{id}/submit-batch")
    public ResponseEntity<ApiResponse> submitBatchPicking(
            @PathVariable Long id,
            @RequestBody List<BatchPickingRequest> items) {
        
        try {
            // 1. Gọi Service (Hàm này giờ là void, không trả về gì cả)
            outboundOrderService.submitBatchPicking(id, items);

            // 2. Trả về thành công với data = null
            return ResponseEntity.ok(ApiResponse.builder()
                    .status("success")
                    .message("Xuất kho thành công!") 
                    .build());

        } catch (BatchPickingException e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .status("bad request")
                    .message("Có lỗi xảy ra với một số sản phẩm!")
                    .data(e.getErrorDetails()) 
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.builder()
                    .status("bad request")
                    .message(e.getMessage())
                    .build());
        }
    }
}
