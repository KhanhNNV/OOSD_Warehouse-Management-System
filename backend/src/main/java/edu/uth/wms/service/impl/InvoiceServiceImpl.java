package edu.uth.wms.service.impl;

import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IInvoiceService;
import edu.uth.wms.dto.request.InvoiceCreateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
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
    private final IOutboundNoteDetailRepository outboundNoteDetailRepository;

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
        // --- BƯỚC MỚI: TẠO PHIẾU XUẤT KHO (OUTBOUND NOTE) TRƯỚC ---
        // Vì Invoice bắt buộc phải có OutboundNoteId
        OutboundNote note = new OutboundNote();
        note.setCode("PXK-" + System.currentTimeMillis()); // Mã phiếu xuất
        note.setOutboundOrder(order);
        note.setExportedDate(LocalDateTime.now()); // Sửa lại tên hàm cho đúng model mới
        note.setStatus(OutboundNoteStatus.COMPLETED); // Giả sử xuất luôn
        note.setCreatedBy(order.getCreatedBy()); // Hoặc lấy User đang login hiện tại
        note.setCreatedAt(LocalDateTime.now());

        OutboundNote savedNote = outboundNoteRepository.save(note);

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
        // 4. Tạo Hóa Đơn (Liên kết với OutboundNote vừa tạo)
        Invoice invoice = new Invoice();

        invoice.setOutboundNote(savedNote); // ĐÚNG: Liên kết với phiếu xuất kho

        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setCustomer(order.getCustomer());
        invoice.setCreatedBy(order.getCreatedBy());
        invoice.setCreatedAt(LocalDateTime.now());
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
        List<OutboundNoteDetail> noteDetails = new ArrayList<>();
        for(OutboundDetail orderDetail : order.getDetails()) {
            InvoiceDetail invDetail = new InvoiceDetail();
            invDetail.setInvoice(savedInvoice);
            invDetail.setProduct(orderDetail.getProduct());
            // So luong
            invDetail.setQuantity(orderDetail.getAllocatedQty());

            // Đơn giá
            BigDecimal price = orderDetail.getProduct().getPrice();
            invDetail.setUnitPrice(price);

            // Công thức: Thành tiền = Đơn giá * Số lượng
            BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(orderDetail.getAllocatedQty()));
            invDetail.setTotalLineAmount(lineTotal);
            // ----------------------------------------------------
            invoiceDetails.add(invDetail);

            // B. TẠO CHI TIẾT PHIẾU XUẤT (CODE MỚI - CHỈ GHI LOG)
            OutboundNoteDetail noteDetail = new OutboundNoteDetail();
            noteDetail.setOutboundNote(savedNote); // Gắn vào phiếu cha
            noteDetail.setProduct(orderDetail.getProduct());
            noteDetail.setQuantity(orderDetail.getAllocatedQty()); // Ghi lại số lượng đã xuất
            noteDetails.add(noteDetail);
        }
        invoiceDetailRepository.saveAll(invoiceDetails);
        outboundNoteDetailRepository.saveAll(noteDetails);
        savedInvoice.setDetails(invoiceDetails);
        // Cập nhật trạng thái đơn hàng từ PACKED -> SHIPPED
        order.setStatus(OrderStatus.SHIPPED);
        outboundOrderRepository.save(order);

        return savedInvoice;

    }

    @Override
    public Invoice getInvoiceById(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy hóa đơn ID: " + id));

        // --- THÊM DÒNG NÀY ---
        // Gọi hàm .size() để ép Hibernate chọc vào DB lấy list con ra (nếu đang để Lazy)
        if (invoice.getDetails() != null) {
            invoice.getDetails().size();
        }

        return invoice;
    }

    // --- TRIỂN KHAI HÀM MỚI ---
    @Override
    public List<Invoice> getAllInvoices() {
        // Lấy tất cả và sắp xếp ngày tạo mới nhất lên đầu (DESC)
        return invoiceRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
    }
}
