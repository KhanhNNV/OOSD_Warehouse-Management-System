package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "outbound_details")
public class OutboundDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // Tạm thời khai báo là Long để map đúng cột DB, sau này đổi thành @ManyToOne sau
    // @Column(name = "outbound_order_id")
    // private Long outboundOrderId;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "requested_qty")
    private int requestedQty;

    @Column(name = "allocated_qty")
    private int allocatedQty;


    // --- RELATIONSHIP (Mối quan hệ) ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outbound_order_id")
    private OutboundOrder outboundOrder;
}
