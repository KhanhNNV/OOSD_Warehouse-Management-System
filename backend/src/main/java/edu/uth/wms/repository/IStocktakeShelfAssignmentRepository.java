package edu.uth.wms.repository;

import edu.uth.wms.model.StocktakeShelfAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IStocktakeShelfAssignmentRepository extends JpaRepository<StocktakeShelfAssignment, Long> {
    List<StocktakeShelfAssignment> findBySessionId(Long sessionId);
    List<StocktakeShelfAssignment> findByStaffUsernameAndStatus(String username, String status);
}