package edu.uth.wms.service;

import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse2;

import java.util.List;

public interface IOutboundOrderService {


    // Hàm mới để lấy danh sách DTO
    List<OutboundOrderResponse2> getAllOrders();
}
