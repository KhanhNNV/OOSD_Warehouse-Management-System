package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.uth.wms.model.PurchaseOrder;

public interface IPurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {

}
