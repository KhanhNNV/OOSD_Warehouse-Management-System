package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "outbound_notes")
@Data // Lombok
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OutboundNote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ngày xuất kho thực tế
    @Column(name = "export_date")
    private LocalDateTime exportDate;

    @OneToOne
    @JoinColumn(name = "invoice_id", referencedColumnName = "id")
    private Invoice invoice;


}
