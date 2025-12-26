package edu.uth.wms.model;

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

    // --- Placeholder cho các mối quan hệ (Làm sau) ---
    // po_id (@ManyToOne)

    // Class: receivedDate -> ERD: received_date
    @Column(name = "received_date")
    private LocalDateTime receivedDate;

    // Class: staffSignature -> ERD: staff_signature
    @Column(name = "staff_signature", length = 100)
    private String staffSignature;

    // --- Placeholder cho các mối quan hệ (Làm sau) ---
    // processed_by_user_id (@ManyToOne)

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
    private User processedByUser;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "inboundNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    private List<InboundDetail> inboundDetails;

    // --- Getters & Setters ---
    // public Long getId() {
    //     return id;
    // }

    // public void setId(Long id) {
    //     this.id = id;
    // }

    // public String getNoteNumber() {
    //     return noteNumber;
    // }

    // public void setNoteNumber(String noteNumber) {
    //     this.noteNumber = noteNumber;
    // }

    // public LocalDateTime getReceivedDate() {
    //     return receivedDate;
    // }

    // public void setReceivedDate(LocalDateTime receivedDate) {
    //     this.receivedDate = receivedDate;
    // }

    // public String getStaffSignature() {
    //     return staffSignature;
    // }

    // public void setStaffSignature(String staffSignature) {
    //     this.staffSignature = staffSignature;
    // }

    // public InboundStatus getStatus() {
    //     return status;
    // }

    // public void setStatus(InboundStatus status) {
    //     this.status = status;
    // }
}