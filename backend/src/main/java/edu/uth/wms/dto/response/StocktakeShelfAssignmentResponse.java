package edu.uth.wms.dto.response;

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
    private String status;
    private String staffName;
}