package edu.uth.wms.repository;

import edu.uth.wms.model.SkuZoneConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ISkuZoneConfigRepository extends JpaRepository<SkuZoneConfig, Long> {
    Optional<SkuZoneConfig> findBySkuPrefix(String skuPrefix);

    boolean existsBySkuPrefix(String skuPrefix);
}