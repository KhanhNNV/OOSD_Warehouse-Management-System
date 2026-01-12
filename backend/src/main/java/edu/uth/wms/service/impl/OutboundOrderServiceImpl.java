package edu.uth.wms.service.impl;

import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.repository.IOutboundDetailRepository;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.service.IOutboundOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OutboundOrderServiceImpl implements IOutboundOrderService {

    private final IOutboundOrderRepository outboundOrderRepository;
    private final IOutboundDetailRepository outboundDetailRepository;

    @Override
    @Transactional(readOnly = true) // Tối ưu tốc độ khi chỉ đọc dữ liệu
    public List<OutboundOrderResponse> getAllOrders() {
        // 1. Lấy tất cả đơn hàng từ Database
        List<OutboundOrder> entities = outboundOrderRepository.findAll();

        // 2. Convert từ Entity sang DTO để trả về Frontend
        return entities.stream().map(order -> {
            return OutboundOrderResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus().name()) // Enum -> String
                    .createdDate(order.getCreatedDate())

                    // Map Customer (Kiểm tra null cho an toàn)
                    .customer(order.getCustomer() != null ? OutboundOrderResponse.CustomerSummary.builder()
                            .id(order.getCustomer().getId())
                            .name(order.getCustomer().getName())
                            .phone(order.getCustomer().getPhone())
                            .address(order.getCustomer().getAddress())
                            .build() : null)

                    // Map User (Người tạo)
                    .createdBy(order.getCreatedBy() != null ? OutboundOrderResponse.UserSummary.builder()
                            .id(order.getCreatedBy().getId())
                            .fullName(order.getCreatedBy().getFullName())
                            .username(order.getCreatedBy().getUsername())
                            .build() : null)

                    .build();
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<OutboundDetailResponse> getOutboundDetails(Long outboundOrderId) {
            outboundOrderRepository.findById(outboundOrderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));
        // - Lấy list outbound_details
        var outboundDetails = outboundDetailRepository.findByOutboundOrderId(outboundOrderId);
        return outboundDetails.stream().map(detail -> OutboundDetailResponse.builder()
                .id(detail.getId())
                .productId(detail.getProduct().getId())
                .productSku(detail.getProduct().getSku())
                .productName(detail.getProduct().getName())
                .unit(detail.getProduct().getUnit())
                .requested_qty(detail.getRequestedQty())
                .build())
                .collect(Collectors.toList());
    }

}