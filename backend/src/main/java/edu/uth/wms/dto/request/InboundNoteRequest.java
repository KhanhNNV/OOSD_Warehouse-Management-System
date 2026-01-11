package edu.uth.wms.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InboundNoteRequest {

    @NotNull(message = "Purchase order id is required")
    private Long purchaseOrderId;

//
//    // --- DETAILS ---
//    @NotEmpty(message = "Inbound details must not be empty")
//    private List<InboundDetailRequest> inboundDetails;
}
