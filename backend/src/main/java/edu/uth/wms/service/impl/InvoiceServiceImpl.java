package edu.uth.wms.service.impl;

import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.repository.IInvoiceDetailRepository;
import edu.uth.wms.repository.IInvoiceRepository;
import edu.uth.wms.repository.IOutboundNoteRepository;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.service.IInvoiceService;
import edu.uth.wms.dto.request.InvoiceCreateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor

public class InvoiceServiceImpl implements IInvoiceService {
    private final IOutboundOrderRepository outboundOrderRepository;
    private final IInvoiceRepository invoiceRepository;
    private final IInvoiceDetailRepository invoiceDetailRepository;
    private final IOutboundNoteRepository outboundNoteRepository;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Invoice createInvoiceFromOrder(InvoiceCreateRequest request){
        // Bước 1 lấy thôg tin đơn hàng gốc
        OutboundOrder order = outboundOrderRepository.findById(request.getOutboundOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng xuất với ID: " + request.getOutboundOrderId()));
        // BƯỚC 2: Kiểm tra trạng thái hợp lệ (Phải là PACKED mới được xuất hóa đơn)
        if (!order.getStatus().name().equalsIgnoreCase("PACKED")) {
            throw new RuntimeException("Đơn hàng chưa được đóng gói (PACKED). Trạng thái hiện tại: " + order.getStatus());
        }


        // 3. Tính tổng tiền (Dùng BigDecimal toàn tập)
        BigDecimal calculatedTotal = BigDecimal.ZERO;

        for (OutboundDetail detail : order.getDetails()) {
            // Lấy số lượng thực tế (int) -> Chuyển sang BigDecimal để nhân
            BigDecimal qty = BigDecimal.valueOf(detail.getAllocatedQty());

            // Lấy giá (đang là BigDecimal sẵn trong Product)
            // Giả sử hàm trong Product là getPrice()
            BigDecimal price = detail.getProduct().getPrice();

            // Công thức: Total = Total + (Price * Qty)
            calculatedTotal = calculatedTotal.add(price.multiply(qty));
        }
        // 4. Tạo Hóa đơn
        Invoice invoice = new Invoice();
        invoice.setOutboundOrder(order);
        invoice.setCustomer(order.getCustomer());// Lấy khách hàng từ đơn gốc
        invoice.setStaff(order.getCreatedBy());
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        // --- BẮT ĐẦU TÍNH THUẾ ---
        // 1. Gán tổng tiền hàng
        invoice.setTotalAmount(calculatedTotal);
        // 2. Tính thuế 8% (Nhân với 0.08)
       BigDecimal taxRate = new BigDecimal("0.08");
       BigDecimal taxAmount = calculatedTotal.multiply(taxRate);
       invoice.setTaxAmount(taxAmount);

        // 3. Tính Tổng thanh toán = Tiền hàng + Thuế (SỬA Ở ĐÂY)
        BigDecimal finalAmount = calculatedTotal.add(taxAmount);
        invoice.setFinalAmount(finalAmount);

        invoice.setStatus(InvoiceStatus.UNPAID);
        Invoice savedInvoice = invoiceRepository.save(invoice);
        //5. Tao chi tiet hoa don
        List<InvoiceDetail> invoiceDetails =new ArrayList<>();
        for(OutboundDetail orderDetail : order.getDetails()) {
            InvoiceDetail invDetail = new InvoiceDetail();
            invDetail.setInvoice(savedInvoice);
            invDetail.setProduct(orderDetail.getProduct());
            // So luong
            invDetail.setQuantity(orderDetail.getAllocatedQty());
            // Gia tien
            invDetail.setUnitPrice(orderDetail.getProduct().getPrice());
            invoiceDetails.add(invDetail);
        }
        invoiceDetailRepository.saveAll(invoiceDetails);
        savedInvoice.setDetails(invoiceDetails);
        // 6 Tao phieu xuat kho
        OutboundNote outboundNote = new OutboundNote();
        outboundNote.setInvoice(savedInvoice);
        outboundNote.setExportDate(LocalDateTime.now());
        outboundNoteRepository.save(outboundNote);
        // Cập nhật trạng thái đơn hàng từ PACKED -> SHIPPED
        order.setStatus(OrderStatus.SHIPPED);
        outboundOrderRepository.save(order);

        return savedInvoice;

    }
}
