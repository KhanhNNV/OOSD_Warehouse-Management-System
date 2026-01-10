package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "invoice_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "invoice_id")
    @JsonIgnore
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    private Integer quantity; // Số lượng lấy từ Note Detail

    private BigDecimal unitPrice; // Lưu giá tại thời điểm xuất
    private BigDecimal totalLineAmount; // qty * unitPrice
}