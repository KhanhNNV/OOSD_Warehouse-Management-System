package edu.uth.wms.repository;

import edu.uth.wms.model.OutboundNote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IOutboundNoteRepository extends JpaRepository<OutboundNote, Long> {

}