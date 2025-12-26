package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "stocktake_details")
public class StocktakeDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // // Tạm thời để Long cho khớp ERD
    // @Column(name = "session_id")
    // private Long sessionId;

    // @Column(name = "product_id")
    // private Long productId;

    // @Column(name = "location_id")
    // private Long locationId;

    @Column(name = "system_qty_snapshot")
    private int systemQtySnapshot;

    @Column(name = "actual_counted_qty")
    private int actualCountedQty;

    // --- RELATIONSHIP ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    @ToString.Exclude
    private StocktakeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Products product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Locations location;
}
