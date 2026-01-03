package edu.uth.wms.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.InboundDetail;
import edu.uth.wms.model.Inventory;

@Repository
public interface IIboundDetailRepository extends JpaRepository<InboundDetail,Long> {

}
