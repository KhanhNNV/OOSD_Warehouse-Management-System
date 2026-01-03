package edu.uth.wms.service;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.model.InboundNote;
import java.util.List;

public interface IInboundService {
    InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems);
    InboundNote approveInboundDifference(Long poId);
}
