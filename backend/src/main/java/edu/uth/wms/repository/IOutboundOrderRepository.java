package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.model.enums.OrderStatus;

// ========================================
// 1. OUTBOUND ORDER REPOSITORY
// ========================================
@Repository
public interface IOutboundOrderRepository extends JpaRepository<OutboundOrder, Long> {
    
    /**
     * Tìm đơn hàng theo số đơn
     */
    Optional<OutboundOrder> findByOrderNumber(String orderNumber);
    
    /**
     * Lấy danh sách đơn hàng theo trạng thái
     */
    List<OutboundOrder> findByStatus(OrderStatus status);
    
    /**
     * Lấy tất cả đơn hàng chưa hoàn tất (để hiển thị trên tab Xuất kho)
     */
    @Query("SELECT o FROM OutboundOrder o WHERE o.status != 'SHIPPED' AND o.status != 'CANCELLED' ORDER BY o.createdDate DESC")
    List<OutboundOrder> findPendingOrders();
}