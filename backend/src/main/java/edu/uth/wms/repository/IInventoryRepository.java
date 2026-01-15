package edu.uth.wms.repository;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.Products;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

public interface IInventoryRepository extends JpaRepository<Inventory,Long> {
    Optional<Inventory> findByProductAndLocation(Products product, Locations location);
    Optional<Inventory> findByProduct_IdAndLocation_Id(Long productId, Long locationId);

        /**
     * Tìm tất cả inventory của product (chỉ lấy kệ có quantity > 0)
     */
    // @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.quantity > 0")
    // List<Inventory> findAllByProductId(@Param("productId") Long productId);
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.quantity > COALESCE(i.quantityAllocated, 0)")
List<Inventory> findAllByProductId(@Param("productId") Long productId);

    /**
     * Tìm inventory theo productId và mã kệ (location.code)
     */
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.location.code = :locationCode")
    Optional<Inventory> findByProductIdAndLocationCode(
        @Param("productId") Long productId,
        @Param("locationCode") String locationCode
    );

    List<Inventory> findByLocation(Locations location);
    Optional<Inventory> findByProductIdAndLocationId(Long productId, Long locationId);
    List<Inventory> findByProductIdAndQuantityAllocatedGreaterThan(Long productId, Integer quantity);
}