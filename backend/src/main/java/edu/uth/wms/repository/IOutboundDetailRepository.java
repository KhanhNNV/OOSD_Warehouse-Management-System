package edu.uth.wms.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.OutboundDetail;

@Repository
public interface IOutboundDetailRepository extends JpaRepository<OutboundDetail, Long>{
    // Lấy tất cả outbound_order_details bằng outbound_order_id cho thằng staff
    List<OutboundDetail> findByOutboundOrderId(Long outboundOrderId);
}
