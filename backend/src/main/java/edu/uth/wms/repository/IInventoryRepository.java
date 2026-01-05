package edu.uth.wms.repository;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

public interface IInventoryRepository extends JpaRepository<Inventory,Long> {
    Optional<Inventory> findByProductAndLocation(Products product, Locations location);
    Optional<Inventory> findByProduct_IdAndLocation_Id(Long productId, Long locationId);
}