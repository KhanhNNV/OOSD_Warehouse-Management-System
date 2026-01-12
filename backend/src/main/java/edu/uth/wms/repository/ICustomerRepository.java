package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Customer;
import edu.uth.wms.model.enums.CustomerType;

@Repository
public interface ICustomerRepository extends JpaRepository<Customer, Long> {

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByTaxCode(String taxCode);

    List<Customer> findByIsActive(Boolean isActive);

    List<Customer> findByCustomerType(CustomerType customerType);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    @Query("SELECT c FROM Customer c WHERE " + "(:keyword IS NULL OR "
            + "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.phone) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.email) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Customer> searchCustomers(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT c FROM Customer c WHERE " + "(:isActive IS NULL OR c.isActive = :isActive) AND "
            + "(:customerType IS NULL OR c.customerType = :customerType) AND " + "(:keyword IS NULL OR "
            + "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(c.phone) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Customer> filterCustomers(@Param("isActive") Boolean isActive,
            @Param("customerType") CustomerType customerType, @Param("keyword") String keyword, Pageable pageable);

}
