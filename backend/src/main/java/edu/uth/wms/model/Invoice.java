package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "invoice_number", unique = true, nullable = false)
    private String invoiceNumber;

    // --- THAY ĐỔI QUAN TRỌNG: Link tới OutboundNote (1-1) ---
    @OneToOne
    @JoinColumn(name = "outbound_note_id", unique = true, nullable = false)
    private OutboundNote outboundNote;

    // Thông tin khách hàng (Redundant để query nhanh)
    @ManyToOne
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    // Kế toán tạo
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy; // Staff/Accountant

    // Tài chính
    private BigDecimal totalAmount; // Chưa thuế
    private BigDecimal taxAmount;   // Thuế
    private BigDecimal finalAmount; // Tổng cộng

    @Enumerated(EnumType.STRING)
    private InvoiceStatus status;


    private LocalDateTime createdAt;
    private LocalDateTime dueDate;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<InvoiceDetail> details;

    @ManyToOne
    @JoinColumn(name = "staff_id")
    private User staff;
}
