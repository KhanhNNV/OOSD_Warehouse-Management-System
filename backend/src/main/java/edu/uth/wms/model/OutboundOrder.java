package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

import edu.uth.wms.model.enums.OrderStatus;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "outbound_orders")
public class OutboundOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @Column(name = "order_number", unique = true, length = 50)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private OrderStatus status;

    // Khách hàng
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    // Thông tin ship
    private String toName;
    private String toPhone;
    private String toAddress;

    @ManyToOne
    @JoinColumn(name = "created_by_user_id")
    private User createdBy;

    @ManyToOne
    @JoinColumn(name = "picker_user_id")
    private User assignedPicker;

    @Column(name = "created_date")
    private LocalDateTime createdDate;

    @OneToMany(mappedBy = "outboundOrder", cascade = CascadeType.ALL,orphanRemoval = true)
    @ToString.Exclude
    private List<OutboundDetail> details;

}
