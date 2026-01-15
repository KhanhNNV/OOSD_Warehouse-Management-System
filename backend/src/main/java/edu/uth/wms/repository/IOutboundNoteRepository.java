package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.OutboundNote;
import edu.uth.wms.model.OutboundOrder;

// ========================================
// 3. OUTBOUND NOTE REPOSITORY
// ========================================
@Repository
public interface IOutboundNoteRepository extends JpaRepository<OutboundNote, Long> {

    /**
     * Tìm phiếu xuất theo mã
     */
    Optional<OutboundNote> findByCode(String code);

    /**
     * Lấy danh sách phiếu xuất theo đơn hàng
     */
    Optional<OutboundNote> findByOutboundOrderId(Long outboundOrderId);


    // Tìm phiếu Note mới nhất của đơn hàng này
    // (Giả sử 1 đơn hàng chỉ có 1 phiếu hoạt động tại 1 thời điểm)
    @Query("SELECT n FROM OutboundNote n WHERE n.outboundOrder = :order ORDER BY n.createdAt DESC LIMIT 1")
    Optional<OutboundNote> findLatestByOrder(@Param("order") OutboundOrder order);

    Optional<OutboundNote> findFirstByOutboundOrderIdOrderByCreatedAtDesc(Long outboundOrderId);
}


