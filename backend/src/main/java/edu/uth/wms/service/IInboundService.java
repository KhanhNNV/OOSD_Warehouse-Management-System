package edu.uth.wms.service;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.PurchaseOrderForStaffResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.model.InboundNote;
import java.util.List;

public interface IInboundService {
    InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems);
    InboundNote approveInboundDifference(Long poId);
    void cancelInbound(Long poId, String reason);

    List<PurchaseOrderForStaffResponse> getAllPurchaseOrders();
}
