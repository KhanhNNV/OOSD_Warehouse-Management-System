package edu.uth.wms.model;

import jakarta.persistence.*;

@Entity
@Table(name = "po_details")
public class PODetail //Chi tiết đơn mua
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // --- Placeholder cho các mối quan hệ (Làm sau) ---
    // po_id (@ManyToOne)
    // product_id (@ManyToOne)

    // Class: expectedQty -> ERD: expected_qty
    @Column(name = "expected_qty")
    private Integer expectedQty;

    // --- Getters & Setters ---
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getExpectedQty() { return expectedQty; }
    public void setExpectedQty(Integer expectedQty) { this.expectedQty = expectedQty; }
}