package edu.uth.wms.repository;

import java.util.List;

import edu.uth.wms.dto.response.PurchaseOrderResponse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.PurchaseOrder;
@Repository
public interface IPurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findAllByOrderByIdDesc();
}
