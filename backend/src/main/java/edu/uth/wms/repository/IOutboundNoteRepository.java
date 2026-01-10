package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.OutboundNote;

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
    List<OutboundNote> findByOutboundOrderId(Long outboundOrderId);
}


