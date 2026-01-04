package edu.uth.wms.repository;

import edu.uth.wms.model.InboundNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IInboundNoteRepository extends JpaRepository<InboundNote, Long> {
    List<InboundNote> findByPurchaseOrderId(Long poId);

}