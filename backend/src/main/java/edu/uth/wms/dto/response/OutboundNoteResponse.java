package edu.uth.wms.dto.response;

import lombok.*;

import java.util.List;

// ========================================
// 6. RESPONSE SAU KHI XUẤT THÀNH CÔNG
// ========================================
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OutboundNoteResponse {
    private String noteCode; // PXK-20260110-001
    private String orderNumber;
    private String status;
    private String exportedDate;
    private List<ExportedItemDetail> items;
}