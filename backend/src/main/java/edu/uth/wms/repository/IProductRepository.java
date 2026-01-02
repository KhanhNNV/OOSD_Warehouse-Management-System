package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Products;
import edu.uth.wms.model.Categories;

@Repository
public interface IProductRepository extends JpaRepository<Products, Long> {

    boolean existsBySku(String sku);

    boolean existsByBarcode(String barcode);

    Categories findByBarcode(String barcode);
}
