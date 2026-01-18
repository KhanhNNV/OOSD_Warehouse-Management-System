package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Products;

@Repository
public interface IProductsRepository extends JpaRepository<Products, Long> {

}