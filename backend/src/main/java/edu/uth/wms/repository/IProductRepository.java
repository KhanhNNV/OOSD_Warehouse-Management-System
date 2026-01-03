package edu.uth.wms.repository;
import edu.uth.wms.model.Products;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

import edu.uth.wms.model.Products;

@Repository
public interface IProductRepository extends JpaRepository<Products, Long> {

    boolean existsBySku(String sku);

    boolean existsByBarcode(String barcode);

    Optional<Products> findBySku(String sku);

    Optional<Products> findByBarcode(String barcode);
}
