package edu.uth.wms.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.AccessType;

@Entity
@Getter
@Setter
@AccessType(AccessType.Type.FIELD)
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "sku_zone_configs")
public class SkuZoneConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    // Mã nhận diện (VD: DO, BK)
    @Column(name = "sku_prefix", unique = true, nullable = false, length = 10)
    private String skuPrefix;

    // Khu vực ưu tiên (VD: A)
    @Column(name = "primary_zone", nullable = false, length = 10)
    private String primaryZone;

    // Khu vực dự phòng (VD: ZZ)
    @Column(name = "backup_zone", length = 10)
    private String backupZone;
}