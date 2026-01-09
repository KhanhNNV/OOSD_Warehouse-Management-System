package edu.uth.wms.repository;

import edu.uth.wms.model.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IInvoiceRepository extends JpaRepository<Invoice, Long> {
    // Có thể thêm hàm tìm kiếm sau này nếu cần
}
