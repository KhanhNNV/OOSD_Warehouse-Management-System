package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "supplier_invoice_details")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierInvoiceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "supplier_invoice_id")
    private SupplierInvoice supplierInvoice;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    // Số lượng thực tế đã nhập (Lấy từ InboundNoteDetail)
    private Integer quantity;

    // Giá nhập (Cost) - Quan trọng để tính giá vốn
    @Column(name = "unit_price")
    private BigDecimal unitPrice;

    @Column(name = "total_line_amount")
    private BigDecimal totalLineAmount; // = quantity * unitPrice
}