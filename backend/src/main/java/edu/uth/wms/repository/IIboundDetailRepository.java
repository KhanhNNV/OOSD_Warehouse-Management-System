package edu.uth.wms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.InboundDetail;
import edu.uth.wms.model.Inventory;

@Repository
public interface IIboundDetailRepository extends JpaRepository<InboundDetail,Long> {
    @Query("SELECT COALESCE(SUM(d.actualQty), 0) FROM InboundDetail d JOIN d.inboundNote n WHERE n.purchaseOrder.id = :poId")
    Integer sumTotalActualQtyByPoId(@Param("poId") Long poId);
}
