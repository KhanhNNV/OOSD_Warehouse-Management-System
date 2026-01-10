package edu.uth.wms.model;

import edu.uth.wms.model.enums.PickingAlgorithmType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ cấu hình hệ thống
 * Chỉ có 1 bản ghi duy nhất trong database (Singleton pattern)
 */
@Entity
@Table(name = "system_config")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Thuật toán xuất kho đang được sử dụng
     * Mặc định: FIFO
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "picking_algorithm", nullable = false)
    @Builder.Default
    private PickingAlgorithmType pickingAlgorithm = PickingAlgorithmType.FIFO;

    /**
     * Người cập nhật cấu hình lần cuối
     */
    @ManyToOne
    @JoinColumn(name = "updated_by_user_id")
    private User updatedBy;

    /**
     * Thời gian cập nhật lần cuối
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}