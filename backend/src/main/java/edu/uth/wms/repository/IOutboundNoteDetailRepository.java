package edu.uth.wms.repository;

import edu.uth.wms.model.OutboundNoteDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IOutboundNoteDetailRepository extends JpaRepository<OutboundNoteDetail, Long> {

}