package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import edu.uth.wms.model.OutboundOrder;

public interface IOutboundOrderRepository extends JpaRepository<OutboundOrder, Long> {

}
