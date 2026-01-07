package edu.uth.wms.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*; // Thư viện OpenPDF
import edu.uth.wms.model.*;
import edu.uth.wms.dto.internal.OutboundExcelItem;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OutboundOrderServiceImpl {

    private final IOutboundOrderRepository orderRepo;
    private final IProductRepository productRepo;
    private final ICustomerRepository customerRepo;
    private final ExcelHelper excelHelper;
    // private final InventoryService inventoryService; // API của Dev 4 (dùng sau)

    // ============================================
    // 1. NHIỆM VỤ IMPORT EXCEL
    // ============================================
    @Transactional
    public OutboundOrder createOrderFromExcel(MultipartFile file, Long customerId, String toName, String toAddress,
            String toPhone) {
        // 1. Validate Customer
        Customer customer = customerRepo.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Khách hàng không tồn tại"));

        // 2. Parse Excel
        if (!excelHelper.hasExcelFormat(file)) {
            throw new RuntimeException("File không đúng định dạng");
        }

        List<OutboundExcelItem> items;
        try {
            items = excelHelper.excelToOutboundItems(file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi đọc file");
        }

        // 3. Tạo Header Đơn hàng
        OutboundOrder order = new OutboundOrder();
        order.setOrderNumber("SO-" + System.currentTimeMillis()); // Mã đơn bán: SO (Sales Order)
        order.setCustomer(customer);
        order.setToName(toName);
        order.setToAddress(toAddress);
        order.setToPhone(toPhone);
        order.setStatus(OrderStatus.NEW);
        order.setDetails(new ArrayList<>());

        // 4. Validate Product & Map Items
        for (OutboundExcelItem item : items) {
            Products product = productRepo.findBySku(item.getSku()).orElseThrow(
                    () -> new RuntimeException("Mã SKU " + item.getSku() + " không tồn tại trong hệ thống"));

            OutboundDetail detail = new OutboundDetail();
            detail.setProduct(product);
            detail.setOutboundOrder(order);

            // QUAN TRỌNG: Lúc này chỉ set yêu cầu, CHƯA ĐƯỢC set allocatedQty (việc này của
            // Dev 4)
            detail.setRequestedQty(item.getQuantity());
            detail.setAllocatedQty(0);

            order.getDetails().add(detail);
        }

        return orderRepo.save(order);
    }

    // ============================================
    // 2. LOGIC DUYỆT ĐƠN (GỌI DEV 4)
    // ============================================
    @Transactional
    public void approveOrder(Long orderId) {
        OutboundOrder order = orderRepo.findById(orderId).orElseThrow();

        if (order.getStatus() != OrderStatus.NEW) {
            throw new RuntimeException("Chỉ đơn hàng MỚI mới được duyệt");
        }

        // --- TODO: GỌI SERVICE CỦA DEV 4 Ở ĐÂY ---
        // boolean allocationResult = inventoryService.allocateInventory(order);
        // if(allocationResult) {
        // order.setStatus(OrderStatus.ALLOCATED);
        // order.setDetails(... cập nhật allocatedQty ...);
        // } else {
        // throw new RuntimeException("Không đủ tồn kho!");
        // }

        // Mock tạm thời cho Dev 2 chạy trước
        order.setStatus(OrderStatus.ALLOCATED); // Giả vờ đã giữ hàng xong
        // Update allocatedQty = requestedQty để in phiếu cho đẹp (Test)
        for (OutboundDetail d : order.getDetails()) {
            d.setAllocatedQty(d.getRequestedQty());
        }
        orderRepo.save(order);
    }

    // ============================================
    // 3. XUẤT FILE PDF "PHIẾU XUẤT KHO" (Hardcore)
    // ============================================
    public void exportDeliveryNotePdf(HttpServletResponse response, Long orderId) throws IOException {
        OutboundOrder order = orderRepo.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng"));

        // Config PDF Response
        response.setContentType("application/pdf");
        String headerKey = "Content-Disposition";
        String headerValue = "attachment; filename=PhieuXuatKho_" + order.getOrderNumber() + ".pdf";
        response.setHeader(headerKey, headerValue);

        // Tạo Document
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, response.getOutputStream());

        document.open();

        // --- Bắt đầu vẽ nội dung theo Mẫu 02-VT ---

        // Font chữ (Cần xử lý tiếng Việt, ở đây demo dùng font mặc định ko dấu hoặc cần
        // load font unicode)
        // Font fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16);
        // Font fontNormal = FontFactory.getFont(FontFactory.HELVETICA, 12);

        // 1. Header Đơn vị (Góc trái) & Mẫu số (Góc phải)
        PdfPTable headerTable = new PdfPTable(2);
        headerTable.setWidthPercentage(100);

        PdfPCell leftHeader = new PdfPCell(new Phrase("Don vi:................\nBo phan:................"));
        leftHeader.setBorder(Rectangle.NO_BORDER);
        headerTable.addCell(leftHeader);

        PdfPCell rightHeader = new PdfPCell(new Phrase("Mau so 02 - VT\n(Ban hanh theo TT 133/2016/TT-BTC)"));
        rightHeader.setBorder(Rectangle.NO_BORDER);
        rightHeader.setHorizontalAlignment(Element.ALIGN_RIGHT);
        headerTable.addCell(rightHeader);
        document.add(headerTable);

        // 2. Tiêu đề
        Paragraph title = new Paragraph("PHIEU XUAT KHO", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18));
        title.setAlignment(Paragraph.ALIGN_CENTER);
        title.setSpacingBefore(20);
        document.add(title);

        Paragraph dateInfo = new Paragraph(
                "Ngay: " + order.getCreatedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        dateInfo.setAlignment(Paragraph.ALIGN_CENTER);
        dateInfo.setSpacingAfter(20);
        document.add(dateInfo);

        // 3. Thông tin chung (Mapping [customer.name], [toName]...)
        document.add(new Paragraph(
                "Khach hang: " + (order.getCustomer() != null ? order.getCustomer().getName() : "Khach le")));
        document.add(new Paragraph("Nguoi nhan hang: " + order.getToName()));
        document.add(new Paragraph("So dien thoai: " + order.getToPhone()));
        document.add(new Paragraph("Dia chi: " + order.getToAddress()));
        document.add(new Paragraph("So phieu: " + order.getOrderNumber()));
        document.add(new Paragraph("Ly do xuat: Xuat ban hang / Order Export"));
        document.add(new Paragraph(" ")); // Dòng trống

        // 4. Bảng chi tiết hàng hóa
        PdfPTable table = new PdfPTable(5); // 5 cột chính theo mẫu
        table.setWidthPercentage(100);
        table.setWidths(new float[] { 1, 2, 4, 1, 2 });

        // Table Header
        table.addCell("STT");
        table.addCell("Ma SP");
        table.addCell("Ten san pham");
        table.addCell("DVT");
        table.addCell("So luong (Thuc xuat)"); // allocatedQty

        // Table Data Loop
        int i = 1;
        for (OutboundDetail detail : order.getDetails()) {
            table.addCell(String.valueOf(i++));
            table.addCell(detail.getProduct().getSku()); // [product.sku]
            table.addCell(detail.getProduct().getName()); // [product.name]
            table.addCell(detail.getProduct().getUnit() != null ? detail.getProduct().getUnit() : "Cai"); // [product.unit]

            // Lưu ý: Phiếu xuất kho thường in ra sau khi đã Allocate/Pick xong
            // Nên hiển thị allocatedQty thay vì requestedQty
            table.addCell(String.valueOf(detail.getAllocatedQty())); // [allocatedQty]
        }
        document.add(table);

        document.add(new Paragraph(" "));

        // 5. Chữ ký (Footer)
        PdfPTable footerTable = new PdfPTable(4);
        footerTable.setWidthPercentage(100);

        // Helper tạo cell chữ ký
        footerTable.addCell(createSignCell("Nguoi lap phieu",
                order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : "System"));
        footerTable.addCell(createSignCell("Nguoi nhan hang", order.getToName()));
        footerTable.addCell(createSignCell("Thu kho",
                order.getAssignedPicker() != null ? order.getAssignedPicker().getFullName() : "..........."));
        footerTable.addCell(createSignCell("Giam doc", "..........."));

        document.add(footerTable);

        document.close();
    }

    private PdfPCell createSignCell(String title, String signer) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setPhrase(new Phrase(title + "\n\n\n\n(Ky, ho ten)\n" + signer));
        return cell;
    }
}