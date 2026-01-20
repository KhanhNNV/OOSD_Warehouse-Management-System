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

    @Column(name = "system_qty_snapshot")
    private Integer systemQtySnapshot;

    @Column(name = "actual_counted_qty")
    private Integer actualCountedQty;

    // --- RELATIONSHIP ---
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "session_id")
    // @ToString.Exclude
    // private StocktakeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private StocktakeShelfAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

}
