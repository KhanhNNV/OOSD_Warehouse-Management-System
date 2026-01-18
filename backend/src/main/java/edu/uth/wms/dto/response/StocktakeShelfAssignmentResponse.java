package edu.uth.wms.dto.response;

import lombok.*;

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
