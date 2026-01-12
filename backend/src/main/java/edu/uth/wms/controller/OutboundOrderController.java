package edu.uth.wms.controller;

import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.service.IOutboundOrderService; // <--- Dùng Service, không dùng Repo nữa
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/outbound-orders")
@RequiredArgsConstructor
public class OutboundOrderController {


    private final IOutboundOrderService outboundOrderService;

    @GetMapping
    public ResponseEntity<List<OutboundOrderResponse>> getAllOrders() {
        // Gọi Service và trả về luôn, không xử lý logic ở đây
        return ResponseEntity.ok(outboundOrderService.getAllOrders());
    }

    @GetMapping("{id}/details")
    public ResponseEntity<List<OutboundDetailResponse>> getOrderDetails(@PathVariable Long id) {

        return ResponseEntity.ok(outboundOrderService.getOutboundDetails(id));
    }
}