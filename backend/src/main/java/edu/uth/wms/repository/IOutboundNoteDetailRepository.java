package edu.uth.wms.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


import edu.uth.wms.model.OutboundNoteDetail;

@Repository
public interface IOutboundNoteDetailRepository extends JpaRepository<OutboundNoteDetail, Long> {

}
