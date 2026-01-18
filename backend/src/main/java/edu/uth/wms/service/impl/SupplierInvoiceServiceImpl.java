package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.SupplierInvoiceCreateRequest;
import edu.uth.wms.dto.response.SupplierInvoiceDetailResponse;
import edu.uth.wms.dto.response.SupplierInvoiceResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.ISupplierInvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder; // 👈 QUAN TRỌNG: Import cái này
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SupplierInvoiceServiceImpl implements ISupplierInvoiceService {

    private final ISupplierInvoiceRepository supplierInvoiceRepo;
    private final ISupplierInvoiceDetailRepository supplierInvoiceDetailRepo;
    private final IInboundNoteRepository inboundNoteRepo;
    private final IUserRepository userRepo;

    @Override
    @Transactional
    public SupplierInvoiceResponse createInvoice(SupplierInvoiceCreateRequest request) {
        log.info("Đang tạo hóa đơn NCC cho phiếu nhập ID: {}", request.getInboundNoteId());

        InboundNote inboundNote = inboundNoteRepo.findById(request.getInboundNoteId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập kho ID: " + request.getInboundNoteId()));

        if (inboundNote.getStatus() != InboundStatus.COMPLETED) {
            throw new BadRequestException("Phiếu nhập kho chưa hoàn thành.");
        }
        if (supplierInvoiceRepo.findByInboundNoteId(inboundNote.getId()).isPresent()) {
            throw new BadRequestException("Phiếu nhập này đã có hóa đơn rồi!");
        }
        if (supplierInvoiceRepo.existsByInvoiceNumber(request.getInvoiceNumber())) {
            throw new BadRequestException("Số hóa đơn đã tồn tại.");
        }

        // Lấy User hiện tại
        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        User creator = userRepo.findByUsername(currentUsername)
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại: " + currentUsername));

        // 1. LƯU HÓA ĐƠN TRƯỚC (HEADER)
        Suppliers supplier = inboundNote.getPurchaseOrder().getSupplier();

        SupplierInvoice invoice = SupplierInvoice.builder()
                .invoiceNumber(request.getInvoiceNumber())
                .inboundNote(inboundNote)
                .supplier(supplier)
                .status(InvoiceStatus.UNPAID)
                .createdAt(LocalDateTime.now())
                .dueDate(request.getDueDate() != null ? request.getDueDate() : LocalDateTime.now().plusDays(30))
                .createdBy(creator)
                .totalAmount(BigDecimal.ZERO) // Tạm thời để 0
                .taxAmount(BigDecimal.ZERO)
                .finalAmount(BigDecimal.ZERO)
                .build();

        // Lưu Header ngay lập tức để có ID
        SupplierInvoice savedInvoice = supplierInvoiceRepo.save(invoice);

        // 2. TÍNH TOÁN VÀ TẠO LIST CHI TIẾT
        BigDecimal totalAmount = BigDecimal.ZERO;
        List<InboundDetail> receivedItems = inboundNote.getInboundDetails();

        // Ép Hibernate tải dữ liệu PO Details (đề phòng Lazy Loading trả về rỗng)
        List<PODetail> poItems = inboundNote.getPurchaseOrder().getDetails();
        if(poItems != null) poItems.size();

        List<SupplierInvoiceDetail> invoiceDetails = new ArrayList<>();

        for (InboundDetail item : receivedItems) {
            // Logic tìm giá từ PO (như cũ)
            BigDecimal unitPrice = item.getProduct().getPrice(); // Mặc định lấy giá Product
            if (poItems != null) {
                for (PODetail poItem : poItems) {
                    if (poItem.getProduct().getId().equals(item.getProduct().getId())) {
                        if (poItem.getUnitPrice() != null) {
                            unitPrice = poItem.getUnitPrice();
                        }
                        break;
                    }
                }
            }

            BigDecimal quantity = new BigDecimal(item.getActualQty());
            BigDecimal lineTotal = unitPrice.multiply(quantity);

            totalAmount = totalAmount.add(lineTotal);

            // Tạo đối tượng chi tiết
            SupplierInvoiceDetail detail = SupplierInvoiceDetail.builder()
                    .supplierInvoice(savedInvoice) // Gán vào Header đã lưu
                    .product(item.getProduct())
                    .quantity(item.getActualQty())
                    .unitPrice(unitPrice)
                    .totalLineAmount(lineTotal)
                    .build();

            invoiceDetails.add(detail);
        }

        // 3. LƯU DANH SÁCH CHI TIẾT (QUAN TRỌNG NHẤT)
        // Dùng repo riêng để lưu, đảm bảo 100% vào DB
        supplierInvoiceDetailRepo.saveAll(invoiceDetails);

        // 4. UPDATE LẠI TỔNG TIỀN CHO HEADER
        BigDecimal taxRate = new BigDecimal("0.1"); // 10%
        BigDecimal taxAmount = totalAmount.multiply(taxRate);

        savedInvoice.setTotalAmount(totalAmount);
        savedInvoice.setTaxAmount(taxAmount);
        savedInvoice.setFinalAmount(totalAmount.add(taxAmount));
        savedInvoice.setDetails(invoiceDetails); // Gán vào để map ra response cho đẹp

        // Lưu cập nhật lần cuối
        supplierInvoiceRepo.save(savedInvoice);

        return mapToResponse(savedInvoice);
    }

    @Override
    public SupplierInvoiceResponse getInvoiceById(Long id) {
        SupplierInvoice invoice = supplierInvoiceRepo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hóa đơn ID: " + id));
        return mapToResponse(invoice);
    }

    @Override
    public List<SupplierInvoiceResponse> getAllInvoices() {
        List<SupplierInvoice> invoices = supplierInvoiceRepo.findAll();
        return invoices.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private SupplierInvoiceResponse mapToResponse(SupplierInvoice inv) {
        List<SupplierInvoiceDetailResponse> details = inv.getDetails().stream()
                .map(d -> SupplierInvoiceDetailResponse.builder()
                        .id(d.getId())
                        .productId(d.getProduct().getId())
                        .productSku(d.getProduct().getSku())
                        .productName(d.getProduct().getName())
                        .quantity(d.getQuantity())
                        .unitPrice(d.getUnitPrice())
                        .totalLineAmount(d.getTotalLineAmount())
                        .build())
                .collect(Collectors.toList());

        return SupplierInvoiceResponse.builder()
                .id(inv.getId())
                .invoiceNumber(inv.getInvoiceNumber())
                .inboundNoteCode(inv.getInboundNote().getNoteNumber())
                .supplierName(inv.getSupplier().getName())
                .totalAmount(inv.getTotalAmount())
                .taxAmount(inv.getTaxAmount())
                .finalAmount(inv.getFinalAmount())
                .status(inv.getStatus())
                .createdAt(inv.getCreatedAt())
                .dueDate(inv.getDueDate())
                .createdByName(inv.getCreatedBy().getFullName())
                .details(details)
                .build();
    }
}