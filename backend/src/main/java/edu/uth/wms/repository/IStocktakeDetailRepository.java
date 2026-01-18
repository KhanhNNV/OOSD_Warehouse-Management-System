package edu.uth.wms.repository;
import edu.uth.wms.model.StocktakeDetail;
// import edu.uth.wms.model.StocktakeSession;
// import edu.uth.wms.model.enums.StocktakeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
// import java.util.Optional;
// ========================================
// 2. STOCKTAKE DETAIL REPOSITORY
// ========================================
@Repository
public interface IStocktakeDetailRepository extends JpaRepository<StocktakeDetail, Long> {
    
    /**
     * Lấy chi tiết theo phiên
     */
    List<StocktakeDetail> findBySessionId(Long sessionId);
    
    /**
     * Lấy chi tiết chưa đếm
     */
    @Query("SELECT d FROM StocktakeDetail d WHERE d.session.id = :sessionId AND d.actualQty IS NULL")
    List<StocktakeDetail> findPendingBySessionId(@Param("sessionId") Long sessionId);
    
   /**
     * Tìm các chi tiết có số lượng thực tế (đã đếm) KHÁC số lượng hệ thống
     * Và phải đã được đếm (actualQty IS NOT NULL)
     */
    @Query("SELECT d FROM StocktakeDetail d " +
           "WHERE d.session.id = :sessionId " +
           "AND d.actualQty IS NOT NULL " +
           "AND d.actualQty <> d.initialQty")
    List<StocktakeDetail> findVariancesBySessionId(@Param("sessionId") Long sessionId);
    
    /**
     * Đếm số sản phẩm đã kiểm
     */
    @Query("SELECT COUNT(d) FROM StocktakeDetail d WHERE d.session.id = :sessionId AND d.actualQty IS NOT NULL")
    int countCountedItems(@Param("sessionId") Long sessionId);
    
    /**
     * Đếm số sản phẩm có chênh lệch
     */
    @Query("SELECT COUNT(d) FROM StocktakeDetail d WHERE d.session.id = :sessionId " +
           "AND d.actualQty IS NOT NULL " +
           "AND d.actualQty != d.initialQty")
    int countVarianceItems(@Param("sessionId") Long sessionId);
    
    /**
     * Xóa tất cả chi tiết theo phiên
     */
    void deleteBySessionId(Long sessionId);
}
