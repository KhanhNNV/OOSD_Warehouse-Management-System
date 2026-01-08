package edu.uth.wms.dto.response;

import edu.uth.wms.model.enums.InboundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InboundNoteResponse {
    private Long id;

    private String noteNumber;

    private LocalDateTime receivedDate;

    private String staffSignature;

    private Integer retryCount;

    private InboundStatus status;

    // ---- RELATION DATA ----

    private Long  purchaseOrderId;
    private String poNumber;

    private String processedBy;


    private List<InboundDetailResponse> inboundDetails;

}
