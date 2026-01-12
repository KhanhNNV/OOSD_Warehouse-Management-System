package edu.uth.wms.controller;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.service.IOutboundService;
import edu.uth.wms.service.utils.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CONTROLLER XUẤT KHO
 */
@RestController
@RequestMapping("/api/outbound")
@RequiredArgsConstructor
public class OutboundController {

    private final IOutboundService outboundService;

    // =================================================================
    // 1. TẠO ĐƠN HÀNG XUẤT MỚI (MANAGER)
    // =================================================================
    /**
     * POST /api/v1/outbound/orders
     * 
     * Body:
     * {
     *   "toName": "Nguyễn Văn A",
     *   "toPhone": "0901234567",
     *   "toAddress": "123 Lê Lợi, Q1, HCM",
     *   "items": [
     *     { "productId": 1, "requestedQty": 10 },
     *     { "productId": 2, "requestedQty": 5 }
     *   ]
     * }
     */
    @PostMapping("/orders")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> createOrder(
        @RequestBody OutboundOrderCreateRequest request
    ) {
        String username = SecurityUtils.getCurrentUserLogin();
        OutboundOrderResponse order = outboundService.createOutboundOrder(username, request);
        
        return ResponseEntity.ok(ApiResponse.<OutboundOrderResponse>builder()
            .status("success")
            .message("Tạo đơn xuất kho thành công")
            .data(order)
            .build());
    }

    // =================================================================
    // 2. LẤY DANH SÁCH ĐƠN CHỜ XUẤT (CHO TAB "XUẤT KHO")
    // =================================================================
    /**
     * GET /api/v1/outbound/orders/pending
     */
    @GetMapping("/orders/pending")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<OutboundOrderResponse>>> getPendingOrders() {
        List<OutboundOrderResponse> orders = outboundService.getPendingOrders();
        
        return ResponseEntity.ok(ApiResponse.<List<OutboundOrderResponse>>builder()
            .status("success")
            .message("Lấy danh sách đơn chờ xuất thành công")
            .data(orders)
            .build());
    }

    // =================================================================
    // 3. LẤY CHI TIẾT ĐƠN HÀNG
    // =================================================================
    /**
     * GET /api/v1/outbound/orders/{id}
     */
    @GetMapping("/orders/{id}")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> getOrderById(
        @PathVariable Long id
    ) {
        OutboundOrderResponse order = outboundService.getOrderById(id);
        
        return ResponseEntity.ok(ApiResponse.<OutboundOrderResponse>builder()
            .status("success")
            .message("Lấy thông tin đơn hàng thành công")
            .data(order)
            .build());
    }

    // =================================================================
    // 4. GỢI Ý KỆ HÀNG CHO STAFF (PICKING INSTRUCTION)
    // =================================================================
    /**
     * GET /api/v1/outbound/orders/{id}/picking-instruction
     * 
     * Response:
     * {
     *   "orderId": 1,
     *   "orderNumber": "OB-123",
     *   "algorithm": "FIFO (First In First Out)",
     *   "tasks": [
     *     {
     *       "productId": 1,
     *       "productSku": "LAP001",
     *       "productName": "Laptop Dell",
     *       "totalNeeded": 10,
     *       "locations": [
     *         {
     *           "locationCode": "A-01-01",
     *           "qtyToPickFromHere": 7,
     *           "availableQty": 15,
     *           "expiryDate": "2026-12-31",
     *           "manufactureDate": "2025-01-01"
     *         },
     *         {
     *           "locationCode": "A-01-02",
     *           "qtyToPickFromHere": 3,
     *           "availableQty": 10,
     *           "expiryDate": "2027-06-30",
     *           "manufactureDate": "2025-06-01"
     *         }
     *       ]
     *     }
     *   ]
     * }
     */
    @GetMapping("/orders/{id}/picking-instruction")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    public ResponseEntity<ApiResponse<PickingInstructionResponse>> getPickingInstruction(
        @PathVariable Long id
    ) {
        PickingInstructionResponse instruction = outboundService.getPickingInstruction(id);
        
        return ResponseEntity.ok(ApiResponse.<PickingInstructionResponse>builder()
            .status("success")
            .message("Tạo chỉ dẫn lấy hàng thành công")
            .data(instruction)
            .build());
    }

    // =================================================================
    // 5. XÁC NHẬN XUẤT KHO (STAFF SCAN & CONFIRM)
    // =================================================================
    /**
     * POST /api/v1/outbound/confirm-picking
     * 
     * Body:
     * {
     *   "outboundOrderId": 1,
     *   "pickedItems": [
     *     {
     *       "productId": 1,
     *       "locationCode": "A-01-01",
     *       "quantity": 7
     *     },
     *     {
     *       "productId": 1,
     *       "locationCode": "A-01-02",
     *       "quantity": 3
     *     }
     *   ]
     * }
     */
    @PostMapping("/confirm-picking")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER')")
    public ResponseEntity<ApiResponse<OutboundNoteResponse>> confirmPicking(
        @RequestBody ConfirmPickingRequest request
    ) {
        String username = SecurityUtils.getCurrentUserLogin();
        OutboundNoteResponse note = outboundService.confirmPicking(username, request);
        
        return ResponseEntity.ok(ApiResponse.<OutboundNoteResponse>builder()
            .status("success")
            .message("Xuất kho thành công")
            .data(note)
            .build());
    }

    // =================================================================
    // 6. HỦY ĐƠN HÀNG
    // =================================================================
    /**
     * DELETE /api/v1/outbound/orders/{id}
     */
    @DeleteMapping("/orders/{id}")
    @PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> cancelOrder(
        @PathVariable Long id
    ) {
        outboundService.cancelOrder(id);
        
        return ResponseEntity.ok(ApiResponse.<Void>builder()
            .status("success")
            .message("Hủy đơn hàng thành công")
            .build());
    }

    // =================================================================
    // 7. LẤY TẤT CẢ ĐƠN HÀNG
    // =================================================================
    /**
     * GET /api/v1/outbound/orders
     */
    @GetMapping("/orders")
    public ResponseEntity<ApiResponse<List<OutboundOrderResponse>>> getAllOrders() {
        List<OutboundOrderResponse> orders = outboundService.getAllOrders();
        
        return ResponseEntity.ok(ApiResponse.<List<OutboundOrderResponse>>builder()
            .status("success")
            .message("Lấy danh sách đơn hàng thành công")
            .data(orders)
            .build());
    }
    // =================================================================
    // 8. KIỂM TRA KHẢ NĂNG CUNG ỨNG (CHECK STOCK AVAILABILITY)
    // =================================================================
    /**
     * POST /api/outbound/check-stock
     * Kiểm tra xem kho có đủ hàng theo thuật toán hiện tại hay không
     */
    @PostMapping("/check-stock")
    @PreAuthorize("hasAnyRole('STAFF', 'MANAGER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> checkStockAvailability(
        @RequestBody StockCheckRequest request
    ) {
        // Gọi Service xử lý logic
        boolean isAvailable = outboundService.checkStockAvailability(request.getProductId(), request.getQuantity());
        
        return ResponseEntity.ok(ApiResponse.<Boolean>builder()
            .status("success")
            .message(isAvailable ? "Hàng có sẵn" : "Không đủ hàng trong kho")
            .data(isAvailable)
            .build());
    }
}