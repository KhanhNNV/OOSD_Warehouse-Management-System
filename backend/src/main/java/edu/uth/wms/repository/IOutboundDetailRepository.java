package edu.uth.wms.repository;

import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;



// ========================================
// 2. OUTBOUND DETAIL REPOSITORY
// ========================================
@Repository
public interface IOutboundDetailRepository extends JpaRepository<OutboundDetail, Long> {

    /**
     * Lấy chi tiết theo đơn hàng
     */
    List<OutboundDetail> findByOutboundOrderId(Long outboundOrderId);
}




