package edu.uth.wms.service;

import edu.uth.wms.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.OutboundOrderRequest;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import java.time.LocalDateTime;

public interface IOutboundOrderService {
    OutboundOrderResponse createOutboundOrder(OutboundOrderRequest request, String username);

    OutboundOrderResponse getOutboundOrderById(Long id);

    OutboundOrderResponse importFromExcel(MultipartFile file, Long customerId, String toName, String toPhone,
            String toAddress, String username);

    OutboundOrderResponse confirmOrder(Long orderId);

    // Hàm mới để lấy danh sách DTO
    //List<OutboundOrderResponse> getAllOrders();

    // Page<OutboundOrderResponse> getOrders(OrderStatus status, Long customerId,
    // LocalDateTime fromDate,
    // LocalDateTime toDate, int page, int size);

    OutboundOrderResponse getOrderDetail(Long orderId);

    OutboundOrderResponse cancelOrder(Long orderId,String reason);

    Page<OutboundOrderResponse> getOrders(OrderStatus status, Long customerId, LocalDateTime fromDate,
                                          LocalDateTime toDate, int page, int size);


}