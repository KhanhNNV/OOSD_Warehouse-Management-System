package edu.uth.wms.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import edu.uth.wms.model.enums.TransactionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "inventory_transactions")
@EntityListeners(AuditingEntityListener.class) // Tự động cập nhật timestamp
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false, length = 20)
    private TransactionType type;


    @Column(name = "quantity_before", nullable = false)
    private Integer quantityBefore;

    @Column(name = "quantity_changed", nullable = false)
    private Integer quantityChanged; // Có thể âm (xuất) hoặc dương (nhập)

    @Column(name = "quantity_after", nullable = false)
    private Integer quantityAfter;

    // Lưu mã PO, Order ID, hoặc Stocktake ID
    @Column(name = "reference_doc_id", length = 50)
    private String referenceDocId;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    @ManyToOne
    @JoinColumn(name = "location_id")
    private Locations location;

    @ManyToOne
    @JoinColumn(name = "performed_by_user_id")
    private User performedBy;

    private LocalDateTime timestamp;

    @PrePersist
    public void prePersist() {
        this.timestamp = LocalDateTime.now();
    }
}