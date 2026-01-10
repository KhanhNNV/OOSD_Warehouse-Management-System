package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "outbound_notes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundNote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String code; // Mã phiếu xuất (PXK-...)

    // Liên kết với Đơn hàng gốc
    @ManyToOne
    @JoinColumn(name = "outbound_order_id")
    private OutboundOrder outboundOrder;

    private LocalDateTime createdAt;
    private LocalDateTime exportedDate; // Ngày xe chạy thực tế

    @Enumerated(EnumType.STRING)
    private OutboundNoteStatus status;

    // Thủ kho tạo phiếu
    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    // Chi tiết phiếu xuất (Lấy từ kệ nào, bao nhiêu)
    @OneToMany(mappedBy = "outboundNote", cascade = CascadeType.ALL)
    @JsonIgnore // Chặn vòng lặp JSON
    private List<OutboundNoteDetail> details;

    // Quan hệ 1-1 với Hóa đơn (1 phiếu xuất -> 1 hóa đơn)
    @OneToOne(mappedBy = "outboundNote")
    @JsonIgnore
    private Invoice invoice;
}