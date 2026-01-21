package edu.uth.wms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Products;

@Repository
public interface IProductRepository extends JpaRepository<Products, Long> {

    boolean existsBySku(String sku);

    boolean existsByBarcode(String barcode);

    Optional<Products> findBySku(String sku);

    Optional<Products> findByBarcode(String barcode);

    /**
     * Tìm SKU cuối cùng theo prefix của category Ví dụ: prefix = "SKU-DO" → tìm
     * SKU-DO1, SKU-DO2, SKU-DO999
     */
    @Query("SELECT p.sku FROM Products p WHERE p.sku LIKE :prefix% ORDER BY p.id DESC LIMIT 1")
    Optional<String> findLastSkuByPrefix(@Param("prefix") String prefix);

    // Alternative: Tìm theo pattern và sort theo số
    @Query(value = "SELECT sku FROM products " + "WHERE sku ~ :pattern " + // PostgreSQL regex
            "ORDER BY CAST(SUBSTRING(sku FROM '[0-9]+$') AS INTEGER) DESC " + "LIMIT 1", nativeQuery = true)
    Optional<String> findLastSkuByPattern(@Param("pattern") String pattern);

    boolean existsByNameAndCategoryId(String name, Long categoryId);
}
