package edu.uth.wms.service;

import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.dto.response.OutboundDetailForStaffResponse;
import edu.uth.wms.dto.response.OutboundOrderForStaffResponse;

import java.util.List;

public interface IOutboundOrderForStaffService {
    // Hàm mới để lấy danh sách DTO
    List<OutboundOrderForStaffResponse> getAllOrders();

    //Hàm lấy danh sách OutboundDetail của id OutboundOder
    List<OutboundDetailForStaffResponse> getOutboundDetails(Long outboundOrderId);

    void submitBatchPicking(Long orderId, List<BatchPickingRequest> items);
}
