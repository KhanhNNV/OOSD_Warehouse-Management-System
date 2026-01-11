package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.SystemConfig;

// ========================================
// 5. SYSTEM CONFIG REPOSITORY
// ========================================
@Repository
public interface ISystemConfigRepository extends JpaRepository<SystemConfig, Long> {
    
    /**
     * Lấy cấu hình hiện tại
     * (Chỉ có 1 bản ghi duy nhất trong bảng)
     */
    @Query("SELECT c FROM SystemConfig c ORDER BY c.id DESC")
    Optional<SystemConfig> findCurrentConfig();
}

// ========================================
// 6. INVENTORY REPOSITORY (Bổ sung query)
// ========================================
// Thêm vào IInventoryRepository hiện có:
interface IInventoryRepositoryExtended extends JpaRepository<Inventory, Long> {
    
    /**
     * Tìm tất cả kệ chứa sản phẩm (để chạy thuật toán)
     */
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.quantity > 0")
    List<Inventory> findAllByProductId(@Param("productId") Long productId);
    
    /**
     * Tìm inventory theo sản phẩm và mã kệ
     */
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.location.code = :locationCode")
    Optional<Inventory> findByProductIdAndLocationCode(
        @Param("productId") Long productId, 
        @Param("locationCode") String locationCode
    );
}