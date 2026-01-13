package edu.uth.wms.controller;

import edu.uth.wms.dto.response.OutboundDetailForStaffResponse;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderForStaffResponse;
import edu.uth.wms.service.IOutboundOrderForStaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/outbound")
@RequiredArgsConstructor
public class OutboundOrderForStaffController {
    private final IOutboundOrderForStaffService outboundOrderService;

    @GetMapping
    public ResponseEntity<List<OutboundOrderForStaffResponse>> getAllOrders() {
        // Gọi Service và trả về luôn, không xử lý logic ở đây
        return ResponseEntity.ok(outboundOrderService.getAllOrders());
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<List<OutboundDetailForStaffResponse>> getOutboundDetails(@PathVariable Long id) {
        return ResponseEntity.ok(outboundOrderService.getOutboundDetails(id));
    }
}
