package edu.uth.wms.model;

import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.model.enums.PaymentMethod;
import jakarta.persistence.*;
import lombok.*; // Dùng Lombok cho gọn code
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder // Thêm cái này để lúc code Service new đối tượng cho nhanh
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber; // Mã hóa đơn: INV-20231025-001

    // Liên kết 1-1: Một đơn xuất kho chỉ có 1 hóa đơn
    @OneToOne
    @JoinColumn(name = "outbound_order_id", nullable = false)
    private OutboundOrder outboundOrder;

    // Lưu lại thông tin khách hàng tại thời điểm xuất hóa đơn (phòng hờ bảng Customer bị xóa)
    // Nhưng để đơn giản, mình join sang bảng Customer cũng được
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // --- PHẦN TIỀN ---
    // Tổng tiền hàng (Chưa thuế)
    @Column(name = "total_amount")
    private BigDecimal totalAmount;

    // Thuế (Để đơn giản mình fix cứng 8% hoặc 10% trong code, hoặc lưu vào đây)
    @Column(name = "tax_amount")
    private BigDecimal taxAmount;

    // Tổng thanh toán = Total + Tax
    @Column(name = "final_amount")
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status; // UNPAID, PAID

    @Enumerated(EnumType.STRING)
    private PaymentMethod paymentMethod; // CASH, BANK

    private LocalDateTime createdAt;

    @PrePersist // Tự động lưu ngày tạo
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Danh sách chi tiết hóa đơn
    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<InvoiceDetail> details;


    @ManyToOne
    @JoinColumn(name = "staff_id")
    private User staff;
}
