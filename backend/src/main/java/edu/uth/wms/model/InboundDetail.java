package edu.uth.wms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "inbound_details")
public class InboundDetail //Chi tiết nhập kho
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

        // --- Placeholder cho các mối quan hệ (Làm sau) ---
    // inbound_note_id (@ManyToOne)
    // product_id (@ManyToOne)

    @Column(name = "actual_qty")
    private Integer actualQty;

    @Column(name = "note", columnDefinition = "nvarchar(255)")
    private String note;

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getActualQty() { return actualQty; }
    public void setActualQty(Integer actualQty) { this.actualQty = actualQty; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
