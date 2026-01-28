package edu.uth.wms.repository;

import edu.uth.wms.model.StocktakeSession;
import edu.uth.wms.model.enums.StocktakeStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IStocktakeSessionRepository extends JpaRepository<StocktakeSession, Long> {

    /**
     * Tìm theo mã phiên
     */
    Optional<StocktakeSession> findByCode(String code);
    
    @Query("SELECT s FROM StocktakeSession s " +
           "ORDER BY " +
           "CASE " +
           "  WHEN s.status = 'DRAFT' THEN 1 " +
           "  WHEN s.status = 'IN_PROGRESS' THEN 2 " +
           "  ELSE 3 " +
           "END ASC, " +
           "s.id DESC")
    Page<StocktakeSession> findAllSessions(Pageable pageable);
    /**
     * Lấy danh sách theo trạng thái
     */
    List<StocktakeSession> findByStatus(StocktakeStatus status);

    /**
     * Lấy danh sách theo nhiều trạng thái (dùng cho lock location)
     */
    List<StocktakeSession> findByStatusIn(List<StocktakeStatus> statuses);

    /**
     * Lấy danh sách phiên đang mở (IN_PROGRESS)
     * Sắp xếp theo ngày bắt đầu giảm dần
     */
    @Query("SELECT s FROM StocktakeSession s WHERE s.status = 'IN_PROGRESS' ORDER BY s.startedAt DESC")
    List<StocktakeSession> findOpenSessions();

}