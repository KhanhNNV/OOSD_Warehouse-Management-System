package edu.uth.wms.repository;

import edu.uth.wms.model.OutboundOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IOutboundOrderRepository extends JpaRepository<OutboundOrder, Long> {
}