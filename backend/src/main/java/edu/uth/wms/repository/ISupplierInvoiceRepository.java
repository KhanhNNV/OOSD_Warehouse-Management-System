package edu.uth.wms.repository;

import edu.uth.wms.model.SupplierInvoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ISupplierInvoiceRepository extends JpaRepository<SupplierInvoice, Long> {

    // 1. Tìm theo số hóa đơn đỏ (Để search)
    Optional<SupplierInvoice> findByInvoiceNumber(String invoiceNumber);

    // 2. Kiểm tra xem số hóa đơn này đã tồn tại chưa (Validate trùng)
    boolean existsByInvoiceNumber(String invoiceNumber);

    // 3. Quan trọng: Kiểm tra xem Phiếu Nhập (InboundNote) này đã được tạo hóa đơn chưa?
    // Tránh việc 1 phiếu nhập mà tạo 2-3 cái hóa đơn thanh toán
    Optional<SupplierInvoice> findByInboundNoteId(Long inboundNoteId);
}