package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import edu.uth.wms.model.enums.StocktakeStatus;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "stocktake_sessions")
public class StocktakeSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "code", unique = true, length = 50)
    private String code;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private StocktakeStatus status;

    // @ManyToOne
    // @JoinColumn(name = "created_by_user_id")
    // private User createdBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id") 
    private User createdBy;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL)
    // @ToString.Exclude
    private List<StocktakeDetail> details;

}
