package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Customer;

@Repository
public interface ICustomerRepository extends JpaRepository<Customer, Long> {

}
