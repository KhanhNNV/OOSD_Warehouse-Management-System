package edu.uth.wms.repository;
import edu.uth.wms.model.Products;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository 
public interface IProductRepository extends JpaRepository<Products,Long> {
    Optional<Products> findByBarcode(String barcode);
}

