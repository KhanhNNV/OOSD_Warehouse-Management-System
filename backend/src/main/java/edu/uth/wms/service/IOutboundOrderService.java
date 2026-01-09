package edu.uth.wms.service;

import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.OutboundOrderRequest;
import edu.uth.wms.dto.response.OutboundOrderResponse;

public interface IOutboundOrderService {
    OutboundOrderResponse createOutboundOrder(OutboundOrderRequest request, Long userId);

    OutboundOrderResponse importFromExcel(MultipartFile file, Long customerId, String toName, String toPhone,
            String toAddress, Long userId);

    OutboundOrderResponse confirmOrder(Long orderId);

    OutboundOrderResponse cancelOrder(Long orderId, String reason);

    // Page<OutboundOrderResponse> getOrders(OrderStatus status, Long customerId,
    // LocalDateTime fromDate,
    // LocalDateTime toDate, int page, int size);

    OutboundOrderResponse getOrderDetail(Long orderId);
}