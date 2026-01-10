package edu.uth.wms.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "outbound_note_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundNoteDetail {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "outbound_note_id")
    @JsonIgnore // Chặn vòng lặp ngược về Note
    private OutboundNote outboundNote;

    @ManyToOne
    @JoinColumn(name = "product_id")
    private Products product;

    // QUAN TRỌNG: Lấy từ kệ nào (Truy xuất nguồn gốc)
    @ManyToOne
    @JoinColumn(name = "source_location_id")
    private Locations sourceLocation;

    private Integer quantity; // Số lượng thực tế xuất
}