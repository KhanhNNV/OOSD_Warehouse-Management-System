package edu.uth.wms.service;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.InboundNoteResponse;
import edu.uth.wms.model.InboundNote;

import java.util.List;

public interface IInboundService {
    InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems);
    InboundNote approveInboundDifference(Long poId);
    void cancelInbound(Long poId, String reason);

    InboundNoteResponse createInboundNote(Long id);

    List<InboundNoteResponse> getMyInboundNotes();
}
