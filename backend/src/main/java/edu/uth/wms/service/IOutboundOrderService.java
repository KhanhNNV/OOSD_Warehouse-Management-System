package edu.uth.wms.service;

import edu.uth.wms.dto.response.OutboundOrderResponse;

import java.util.List;

public interface IOutboundOrderService {


    // Hàm mới để lấy danh sách DTO
    List<OutboundOrderResponse> getAllOrders();
}
