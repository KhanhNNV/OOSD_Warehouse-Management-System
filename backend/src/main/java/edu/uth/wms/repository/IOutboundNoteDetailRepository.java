package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.OutboundNoteDetail;

// ========================================
// 4. OUTBOUND NOTE DETAIL REPOSITORY
// ========================================
@Repository
public interface IOutboundNoteDetailRepository extends JpaRepository<OutboundNoteDetail, Long> {

    /**
     * Lấy chi tiết theo phiếu xuất
     */
    List<OutboundNoteDetail> findByOutboundNoteId(Long outboundNoteId);

    Optional<OutboundNoteDetail>
    findByOutboundNoteIdAndProductIdAndSourceLocationId(
            Long outboundNoteId,
            Long productId,
            Long sourceLocationId
    );
    List<OutboundNoteDetail> findAllByOutboundNoteId(Long outboundNoteId);
}
