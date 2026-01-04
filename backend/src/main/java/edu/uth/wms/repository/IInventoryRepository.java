package edu.uth.wms.repository;

import edu.uth.wms.model.Inventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IInventoryRepository extends JpaRepository<Inventory, Long> {

    // Hàm này cực quan trọng: Giúp tìm xem sản phẩm này đã có trong kho chưa
    // Được gọi ở dòng: inventoryRepo.findByProductId(productId) trong Service
    Optional<Inventory> findByProductId(Long productId);

}