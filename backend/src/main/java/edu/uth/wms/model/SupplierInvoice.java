package edu.uth.wms.model;

import edu.uth.wms.model.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "supplier_invoices")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierInvoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Mã hóa đơn đỏ do NCC gửi (VD: AB/23P...)
    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber;

    // Liên kết 1-1 với Phiếu Nhập Kho (Nhập phiếu nào, trả tiền phiếu đó)
    @OneToOne
    @JoinColumn(name = "inbound_note_id", unique = true, nullable = false)
    private InboundNote inboundNote;

    // Nhà cung cấp (Lấy từ InboundNote sang cũng được, nhưng lưu đây để query cho nhanh)
    @ManyToOne
    @JoinColumn(name = "supplier_id", nullable = false)
    private Suppliers supplier;

    // --- TIỀN NONG (Quan trọng) ---
    @Column(name = "total_amount")
    private BigDecimal totalAmount; // Tiền hàng

    @Column(name = "tax_amount")
    private BigDecimal taxAmount;   // Thuế VAT

    @Column(name = "final_amount")
    private BigDecimal finalAmount; // Tổng phải trả

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InvoiceStatus status; // UNPAID, PAID...

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "due_date")
    private LocalDateTime dueDate; // Hạn chót thanh toán

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    // Danh sách chi tiết
    @OneToMany(mappedBy = "supplierInvoice", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SupplierInvoiceDetail> details = new ArrayList<>();
}