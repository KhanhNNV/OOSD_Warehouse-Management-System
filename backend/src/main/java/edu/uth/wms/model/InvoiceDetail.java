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
    @JoinColumn(name = "invoice_id", nullable = false)
    @JsonIgnore
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

    // Giá bán 1 cái (Lấy từ bảng Product tại thời điểm tạo hóa đơn)
    private BigDecimal unitPrice;

    // Số lượng (Copy y nguyên từ OutboundDetail.requestedQty sang)
    private Integer quantity;

    // Thành tiền = unitPrice * quantity
    private BigDecimal totalPrice;
}