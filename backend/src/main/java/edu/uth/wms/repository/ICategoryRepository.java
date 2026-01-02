package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Categories;

@Repository
public interface ICategoryRepository extends JpaRepository<Categories, Long> {
    boolean existsByName(String name);
}
