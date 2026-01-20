package edu.uth.wms.service;
import java.util.List;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;


// ========================================
// 2. OUTBOUND SERVICE INTERFACE
// ========================================
public interface IOutboundService {
    
    // Lấy danh sách
    List<OutboundOrderResponse> getAllOrders();
    List<OutboundOrderResponse> getPendingOrders();
    OutboundOrderResponse getOrderById(Long id);
    
    // Gợi ý kệ hàng
    PickingInstructionResponse getPickingInstruction(Long orderId);

    
    // Hủy đơn
    void cancelOrder(Long orderId);

    Boolean checkStockAvailability(Long productId, Integer quantity);

    // Staff đăng kí 
    String registerPicking (Long orderId);

    ScanPickResponse processScanPick(ScanPickRequest request);

    void finishPicking(Long orderId);

}
