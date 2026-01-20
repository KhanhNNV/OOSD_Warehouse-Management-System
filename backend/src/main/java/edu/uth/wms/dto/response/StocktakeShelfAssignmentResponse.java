package edu.uth.wms.dto.response;

import java.time.LocalDateTime;

import edu.uth.wms.model.enums.AssignmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StocktakeShelfAssignmentResponse {
    private Long id;
    private Long sessionId;
    private String sessionCode;
    private Long locationId;
    private String locationCode;
    private AssignmentStatus status;
    private String staffName;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}