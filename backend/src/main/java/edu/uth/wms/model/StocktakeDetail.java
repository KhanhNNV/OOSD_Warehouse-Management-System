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

    /**
     * Số lượng sau khi Manager đã xem báo cáo và điều chỉnh lại (nếu có)
     */
    @Column(name = "manager_adjusted_qty")
    private Integer managerAdjustedQty;

    /**
     * Người thực hiện điều chỉnh (Manager)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "adjusted_by_id")
    private User adjustedBy;

    /**
     * Thời điểm điều chỉnh
     */
    @Column(name = "adjusted_at")
    private java.time.LocalDateTime adjustedAt;

    // --- RELATIONSHIP ---
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "session_id")
    // @ToString.Exclude
    // private StocktakeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private StocktakeShelfAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private Inventory inventory;

}
