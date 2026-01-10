package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Phiếu xuất kho thực tế
 * Được tạo ra khi Staff thực hiện lấy hàng theo OutboundOrder
 */
@Entity
@Table(name = "outbound_notes")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "code", unique = true, length = 50)
    private String code; // PXK-20260110-001

    /**
     * Thuộc đơn hàng nào
     */
    @ManyToOne
    @JoinColumn(name = "outbound_order_id", nullable = false)
    private OutboundOrder outboundOrder;

    /**
     * Trạng thái phiếu xuất
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OutboundNoteStatus status;

    /**
     * Thời gian tạo phiếu
     */
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    /**
     * Thời gian xuất hàng thực tế (xe chạy)
     */
    @Column(name = "exported_date")
    private LocalDateTime exportedDate;

    /**
     * Nhân viên xác nhận xuất
     */
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    /**
     * Danh sách chi tiết: Lấy từ kệ nào, bao nhiêu
     */
    @OneToMany(mappedBy = "outboundNote", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @JsonIgnore
    private List<OutboundNoteDetail> details;

    // Quan hệ 1-1 với Hóa đơn (1 phiếu xuất -> 1 hóa đơn)
    @OneToOne(mappedBy = "outboundNote")
    @JsonIgnore
    private Invoice invoice;
}