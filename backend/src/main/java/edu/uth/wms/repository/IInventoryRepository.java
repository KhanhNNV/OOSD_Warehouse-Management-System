package edu.uth.wms.repository;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface IInventoryRepository extends JpaRepository<Inventory,Long> {
    Optional<Inventory> findByProductAndLocation(Products product, Locations location);
}
