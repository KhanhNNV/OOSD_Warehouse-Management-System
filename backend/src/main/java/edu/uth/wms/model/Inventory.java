package edu.uth.wms.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "inventory", indexes = {
        @Index(name = "idx_inventory_product_location", columnList = "product_id, location_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Inventory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // @Column(name = "product_id", nullable = false)
    // private Long productId;

    // @Column(name = "location_id", nullable = false)
    // private Long locationId;

    // Default 0 as per DBML
    @Builder.Default
    @Column(name = "quantity", nullable = false)
    private Integer quantity = 0;

    @Column(name = "expiry_date")
    private LocalDate expiryDate;

    @Column(name = "manufacture_date")
    private LocalDate manufactureDate;

    // Hệ thống có logic "Giữ chỗ" (Soft Allocate).
    // Nếu bạn muốn hỗ trợ tính năng này, nên thêm trường:
    // private Integer allocatedQuantity = 0;
    // public Integer getAvailableQuantity() { return quantity - allocatedQuantity;
    // }

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "location_id", nullable = false)
    private Locations location;

}