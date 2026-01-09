package edu.uth.wms.repository;

import java.util.Optional;


import edu.uth.wms.model.enums.InboundStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import edu.uth.wms.model.InboundNote;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface IInboundNoteRepository extends JpaRepository<InboundNote, Long> {
    Optional<InboundNote> findById (Long poId);
    List<InboundNote> findByPurchaseOrderId(Long poId);

    boolean existsByPurchaseOrderIdAndStatus(Long purchaseOrderId, InboundStatus status);

    long countByPurchaseOrderIdAndProcessedByIdAndStatus(Long poId, Long userId, InboundStatus status);

    List<InboundNote> findByProcessedBy_UsernameOrderByReceivedDateDesc(String username);

    Optional<InboundNote> findByPurchaseOrderIdAndStatus(Long poId, InboundStatus status);
}
