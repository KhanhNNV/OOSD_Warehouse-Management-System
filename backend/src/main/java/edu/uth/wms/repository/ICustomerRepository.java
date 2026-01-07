package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import edu.uth.wms.model.Customer;

public interface ICustomerRepository extends JpaRepository<Customer, Long> {

}
