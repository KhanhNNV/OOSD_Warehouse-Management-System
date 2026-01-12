package edu.uth.wms.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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


    List<OutboundOrder> findByCreatedDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT o FROM OutboundOrder o WHERE " + "(:status IS NULL OR o.status = :status) AND "
            + "(:customerId IS NULL OR o.customer.id = :customerId) AND "
            + "(:fromDate IS NULL OR o.createdDate >= :fromDate) AND "
            + "(:toDate IS NULL OR o.createdDate <= :toDate)")
    Page<OutboundOrder> filterOrders(@Param("status") OrderStatus status, @Param("customerId") Long customerId,
                                     @Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate,
                                     Pageable pageable);


    @Query("SELECT o FROM OutboundOrder o " + "LEFT JOIN FETCH o.details d " + "LEFT JOIN FETCH d.product "
            + "WHERE o.id = :orderId")
    Optional<OutboundOrder> findByIdWithDetails(@Param("orderId") Long orderId);
}
