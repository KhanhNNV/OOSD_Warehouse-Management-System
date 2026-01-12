package edu.uth.wms.service;
import java.util.List;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.enums.PickingAlgorithmType;


// ========================================
// 2. OUTBOUND SERVICE INTERFACE
// ========================================
public interface IOutboundService {
    // Tạo đơn
    OutboundOrderResponse createOutboundOrder(String username, OutboundOrderCreateRequest request);
    
    // Lấy danh sách
    List<OutboundOrderResponse> getAllOrders();
    List<OutboundOrderResponse> getPendingOrders();
    OutboundOrderResponse getOrderById(Long id);
    
    // Gợi ý kệ hàng
    PickingInstructionResponse getPickingInstruction(Long orderId);
    
    // Xác nhận xuất
    OutboundNoteResponse confirmPicking(String username, ConfirmPickingRequest request);
    
    // Hủy đơn
    void cancelOrder(Long orderId);

    Boolean checkStockAvailability(Long productId, Integer quantity);
}
