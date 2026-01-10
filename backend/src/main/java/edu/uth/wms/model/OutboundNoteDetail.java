package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;

/**
 * Chi tiết phiếu xuất kho thực tế
 * Ghi nhận: Lấy bao nhiêu hàng, từ kệ nào
 */
@Entity
@Table(name = "outbound_note_details")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundNoteDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "outbound_note_id", nullable = false)
    @ToString.Exclude
    private OutboundNote outboundNote;

    @ManyToOne
    @JoinColumn(name = "product_id", nullable = false)
    private Products product;

    /**
     * QUAN TRỌNG: Lấy hàng từ kệ nào
     * Phục vụ truy xuất nguồn gốc và validate scan
     */
    @ManyToOne
    @JoinColumn(name = "source_location_id", nullable = false)
    private Locations sourceLocation;

    /**
     * Số lượng xuất từ kệ này
     */
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
}