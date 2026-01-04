package edu.uth.wms.repository;

import java.util.Optional;


import org.springframework.data.jpa.repository.JpaRepository;

import edu.uth.wms.model.InboundNote;

public interface IInboundNoteRepository extends JpaRepository <InboundNote, Long> {
    public Optional<InboundNote> findById (Long poId);
}
