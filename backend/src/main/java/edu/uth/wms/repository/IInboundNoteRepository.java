package edu.uth.wms.repository;

import java.util.Optional;


import org.springframework.data.jpa.repository.JpaRepository;

import edu.uth.wms.model.InboundNote;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface IInboundNoteRepository extends JpaRepository<InboundNote, Long> {
    Optional<InboundNote> findById (Long poId);
    List<InboundNote> findByPurchaseOrderId(Long poId);

}
