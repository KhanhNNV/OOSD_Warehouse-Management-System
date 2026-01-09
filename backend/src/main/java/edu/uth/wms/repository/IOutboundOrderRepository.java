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

@Repository
public interface IOutboundOrderRepository extends JpaRepository<OutboundOrder, Long> {
        Optional<OutboundOrder> findByOrderNumber(String orderNumber);

        List<OutboundOrder> findByStatus(OrderStatus status);

        List<OutboundOrder> findByCreatedDateBetween(LocalDateTime start, LocalDateTime end);

        @Query("SELECT o FROM OutboundOrder o WHERE " + "(:status IS NULL OR o.status = :status) AND "
                        + "(:customerId IS NULL OR o.customer.id = :customerId) AND "
                        + "(:fromDate IS NULL OR o.createdDate >= :fromDate) AND "
                        + "(:toDate IS NULL OR o.createdDate <= :toDate)")
        Page<OutboundOrder> filterOrders(@Param("status") OrderStatus status, @Param("customerId") Long customerId,
                        @Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate,
                        Pageable pageable);

        // @Query("SELECT o FROM OutboundOrder o " +
        // "LEFT JOIN FETCH o.customer " +
        // "LEFT JOIN FETCH o.createdBy " +
        // "LEFT JOIN FETCH o.assignedPicker " +
        // "WHERE (:status IS NULL OR o.status = :status) " +
        // "AND (:customerId IS NULL OR o.customer.id = :customerId) " +
        // "AND (:fromDate IS NULL OR o.createdDate >= :fromDate) " +
        // "AND (:toDate IS NULL OR o.createdDate <= :toDate)")
        // Page<OutboundOrder> filterOrders(
        // @Param("status") OrderStatus status,
        // @Param("customerId") Long customerId,
        // @Param("fromDate") LocalDateTime fromDate,
        // @Param("toDate") LocalDateTime toDate,
        // Pageable pageable
        // );

        @Query("SELECT o FROM OutboundOrder o " + "LEFT JOIN FETCH o.details d " + "LEFT JOIN FETCH d.product "
                        + "WHERE o.id = :orderId")
        Optional<OutboundOrder> findByIdWithDetails(@Param("orderId") Long orderId);
}
