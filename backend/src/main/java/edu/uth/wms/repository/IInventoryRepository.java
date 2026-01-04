package edu.uth.wms.repository;

import edu.uth.wms.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IInventoryRepository extends JpaRepository<Inventory, Long> {

    Optional<Inventory> findByProduct_IdAndLocation_Id(Long productId, Long locationId);

}