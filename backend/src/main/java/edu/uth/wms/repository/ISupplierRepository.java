package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Suppliers;

@Repository
public interface ISupplierRepository extends JpaRepository<Suppliers, Long> {
    boolean existsByEmail(String email);

    boolean existsByPhone(String phone);
}
