package edu.uth.wms.repository;

import edu.uth.wms.model.SupplierInvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ISupplierInvoiceDetailRepository extends JpaRepository<SupplierInvoiceDetail, Long> {

    // Tìm tất cả chi tiết của một hóa đơn cụ thể (nếu cần dùng riêng lẻ)
    List<SupplierInvoiceDetail> findBySupplierInvoiceId(Long supplierInvoiceId);
}