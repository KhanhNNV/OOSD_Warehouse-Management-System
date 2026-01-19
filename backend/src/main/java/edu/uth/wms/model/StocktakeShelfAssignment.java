package edu.uth.wms.model;

import edu.uth.wms.model.enums.AssignmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "stocktake_shelf_assignments")
public class StocktakeShelfAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id")
    private StocktakeSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private Locations location;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private User staff;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private AssignmentStatus status;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "assignment", cascade = CascadeType.ALL)
    private List<StocktakeDetail> details;
}