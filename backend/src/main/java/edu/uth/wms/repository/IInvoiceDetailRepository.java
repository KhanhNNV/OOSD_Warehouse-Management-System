package edu.uth.wms.repository;

import edu.uth.wms.model.InvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IInvoiceDetailRepository extends JpaRepository<InvoiceDetail, Long> {
}