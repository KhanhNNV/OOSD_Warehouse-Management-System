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
import java.util.Optional;
import com.lowagie.text.Document;
import com.lowagie.text.Paragraph;
import com.lowagie.text.pdf.PdfWriter;
import java.io.ByteArrayOutputStream;

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
        // 1. Lấy thông tin đơn hàng gốc
        OutboundOrder order = outboundOrderRepository.findById(request.getOutboundOrderId())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng xuất với ID: " + request.getOutboundOrderId()));

        // 2. TÌM PHIẾU XUẤT (Dùng Optional như ông muốn)
        Optional<OutboundNote> noteOpt = outboundNoteRepository.findByOutboundOrderId(order.getId());

        // Nếu KHÔNG CÓ phiếu xuất -> Báo lỗi ngay
        if (noteOpt.isEmpty()) {
            throw new RuntimeException("Lỗi: Đơn hàng này chưa được xuất kho (Chưa có Outbound Note). " +
                    "Vui lòng yêu cầu kho xử lý trước!");
        }

        // Lấy phiếu xuất ra (vì đã check isEmpty nên get() an toàn)
        OutboundNote savedNote = noteOpt.get();

        // 3. Kiểm tra trùng: 1 Phiếu xuất chỉ được xuất 1 Hóa đơn
        if (savedNote.getInvoice() != null) {
            throw new RuntimeException("Đơn hàng này ĐÃ CÓ HÓA ĐƠN RỒI (Mã: "
                    + savedNote.getInvoice().getInvoiceNumber() + ")");
        }

        // 4. Tính tổng tiền (Logic cũ)
        BigDecimal calculatedTotal = BigDecimal.ZERO;
        for (OutboundDetail detail : order.getDetails()) {
            BigDecimal qty = BigDecimal.valueOf(detail.getAllocatedQty());
            BigDecimal price = detail.getProduct().getPrice();
            calculatedTotal = calculatedTotal.add(price.multiply(qty));
        }

        // 5. Tạo Hóa Đơn (Gắn vào phiếu xuất tìm được)
        Invoice invoice = new Invoice();
        invoice.setOutboundNote(savedNote); // Link vào phiếu xuất
        invoice.setInvoiceNumber("INV-" + System.currentTimeMillis());
        invoice.setCustomer(order.getCustomer());
        invoice.setCreatedBy(order.getCreatedBy());
        invoice.setCreatedAt(LocalDateTime.now());

        // Tính thuế
        invoice.setTotalAmount(calculatedTotal);
        invoice.setTaxAmount(calculatedTotal.multiply(new BigDecimal("0.08")));
        invoice.setFinalAmount(calculatedTotal.add(invoice.getTaxAmount()));
        invoice.setStatus(InvoiceStatus.UNPAID);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        // 6. Tạo chi tiết hóa đơn
        List<InvoiceDetail> invoiceDetails = new ArrayList<>();
        for(OutboundDetail orderDetail : order.getDetails()) {
            InvoiceDetail invDetail = new InvoiceDetail();
            invDetail.setInvoice(savedInvoice);
            invDetail.setProduct(orderDetail.getProduct());
            invDetail.setQuantity(orderDetail.getAllocatedQty());
            invDetail.setUnitPrice(orderDetail.getProduct().getPrice());
            invDetail.setTotalLineAmount(invDetail.getUnitPrice().multiply(BigDecimal.valueOf(invDetail.getQuantity())));
            invoiceDetails.add(invDetail);
        }
        invoiceDetailRepository.saveAll(invoiceDetails);
        savedInvoice.setDetails(invoiceDetails);

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

    @Override
    @Transactional
    public void markAsPaid(Long id) {
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found: " + id));
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);
    }

    @Override
    public byte[] exportPdf(Long id) {
        Invoice invoice = getInvoiceById(id);

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, out);
            document.open();

            document.add(new Paragraph("SALES INVOICE"));
            document.add(new Paragraph("------------------------------------------------"));
            document.add(new Paragraph("Invoice Number: " + invoice.getInvoiceNumber()));
            document.add(new Paragraph("Customer: " + (invoice.getCustomer() != null ? invoice.getCustomer().getName() : "N/A")));
            document.add(new Paragraph("Date: " + invoice.getCreatedAt()));
            document.add(new Paragraph("Status: " + invoice.getStatus()));
            document.add(new Paragraph("------------------------------------------------"));

            if (invoice.getDetails() != null) {
                 for (InvoiceDetail d : invoice.getDetails()) {
                     document.add(new Paragraph(d.getProduct().getName() + " x " + d.getQuantity() + " = " + d.getTotalLineAmount()));
                 }
            }

            document.add(new Paragraph("------------------------------------------------"));
            document.add(new Paragraph("TOTAL: " + invoice.getFinalAmount()));

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Error generating PDF", e);
        }
    }
}
