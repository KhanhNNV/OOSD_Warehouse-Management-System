package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import edu.uth.wms.model.enums.InboundStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "inbound_notes")
public class InboundNote // Phiếu nhập kho
{

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Class: noteNumber -> ERD: note_number
    @Column(name = "note_number", unique = true, length = 50)
    private String noteNumber;

    // Class: receivedDate -> ERD: received_date
    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    // Class: staffSignature -> ERD: staff_signature
    @Column(name = "staff_signature", length = 100)
    private String staffSignature;

    // Class: status -> ERD: status
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private InboundStatus status;

    // --- RELATIONSHIPS (Mối quan hệ) ---

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "po_id")
    private PurchaseOrder purchaseOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "processed_by_user_id")
    private User processedBy;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "inboundNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonManagedReference
    private List<InboundDetail> inboundDetails;

}