package edu.uth.wms.service.impl;

import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.service.IOutboundOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OutboundOrderServiceImpl implements IOutboundOrderService {

    private final IOutboundOrderRepository outboundOrderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<OutboundOrderResponse> getAllOrders() {
        // 1. Lấy tất cả đơn hàng từ Database
        List<OutboundOrder> entities = outboundOrderRepository.findAll();

        // 2. Convert từ Entity sang DTO (Cấu trúc Phẳng - Flat)
        return entities.stream().map(order -> {

            // --- TÍNH TOÁN CÁC CHỈ SỐ THỐNG KÊ ---
            int totalItems = 0;
            int totalQuantity = 0;
            BigDecimal calculatedTotalAmount = BigDecimal.ZERO;

            if (order.getDetails() != null) {
                totalItems = order.getDetails().size(); // Số dòng sản phẩm

                for (OutboundDetail detail : order.getDetails()) {
                    // Cộng dồn số lượng
                    totalQuantity += detail.getAllocatedQty();

                    // Cộng dồn tổng tiền (Quan trọng cho Kế Toán)
                    // Công thức: Giá x Số lượng
                    if (detail.getProduct() != null && detail.getProduct().getPrice() != null) {
                        BigDecimal lineTotal = detail.getProduct().getPrice()
                                .multiply(BigDecimal.valueOf(detail.getAllocatedQty()));
                        calculatedTotalAmount = calculatedTotalAmount.add(lineTotal);
                    }
                }
            }

            // --- MAP DỮ LIỆU VÀO DTO ---
            return OutboundOrderResponse.builder()
                    .id(order.getId())
                    .orderNumber(order.getOrderNumber())
                    .status(order.getStatus().name())

                    // Xử lý ngày tháng (Nếu DTO là String thì format, nếu là LocalDateTime thì bỏ .format đi)
                    .createdDate(order.getCreatedDate())

                    // Map thông tin khách hàng (Phẳng - Không dùng CustomerSummary nữa)
                    .customerName(order.getCustomer() != null ? order.getCustomer().getName() : "Khách lẻ")
                    .toName(order.getToName())
                    .toPhone(order.getToPhone())
                    .toAddress(order.getToAddress())

                    // Map các chỉ số đã tính ở trên
                    .totalItems(totalItems)
                    .totalQuantity(totalQuantity)
                    .totalAmount(calculatedTotalAmount) // <--- Field quan trọng của mình

                    // .details(null) // Tạm thời chưa cần chi tiết thì để null cho nhẹ
                    .build();

        }).collect(Collectors.toList());
    }
}