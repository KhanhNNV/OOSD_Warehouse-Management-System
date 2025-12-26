package edu.uth.wms.model;

import edu.uth.wms.model.enums.POStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "purchase_orders")
public class PurchaseOrder // Đơn mua hàng
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Class: poNumber -> ERD: po_number
    @Column(name = "po_number", unique = true, length = 50)
    private String poNumber;

    // --- Placeholder cho các mối quan hệ (Làm sau) ---
    // supplier_id (@ManyToOne)
    // List<PODetail> (@OneToMany)

    // Class: expectedDate -> ERD: expected_date
    @Column(name = "expected_date")
    private LocalDateTime expectedDate;

    // Class: status -> ERD: status
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private POStatus status;

    // ERD: created_at (default now)
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // ---  RELATIONSHIPS (Mối quan hệ) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "supplier_id")
    private Suppliers supplier;

    @OneToMany(mappedBy = "purchaseOrder", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PODetail> poDetails;

    // --- Constructor & PrePersist ---

    // @PrePersist
    // protected void onCreate() {
    //     this.createdAt = LocalDateTime.now();
    //     if (this.status == null) {
    //         this.status = POStatus.NEW;
    //     }
    // }

    
    // // --- Getters & Setters ---
    // public Long getId() {
    //     return id;
    // }

    // public void setId(Long id) {
    //     this.id = id;
    // }

    // public String getPoNumber() {
    //     return poNumber;
    // }

    // public void setPoNumber(String poNumber) {
    //     this.poNumber = poNumber;
    // }

    // public LocalDateTime getExpectedDate() {
    //     return expectedDate;
    // }

    // public void setExpectedDate(LocalDateTime expectedDate) {
    //     this.expectedDate = expectedDate;
    // }

    // public POStatus getStatus() {
    //     return status;
    // }

    // public void setStatus(POStatus status) {
    //     this.status = status;
    // }

    // public LocalDateTime getCreatedAt() {
    //     return createdAt;
    // }

    // public void setCreatedAt(LocalDateTime createdAt) {
    //     this.createdAt = createdAt;
    // }

    // // Class method: void importFromExcel(File file) -> Xử lý ở Service layer, không
    // // viết trong Entity
}