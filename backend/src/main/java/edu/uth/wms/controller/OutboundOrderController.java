// package edu.uth.wms.controller;

// import java.time.LocalDateTime;

// import org.springframework.data.domain.Page;
// import org.springframework.format.annotation.DateTimeFormat;
// import org.springframework.http.ResponseEntity;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
// import org.springframework.security.core.userdetails.UserDetails;
// import org.springframework.web.bind.annotation.GetMapping;
// import org.springframework.web.bind.annotation.PathVariable;
// import org.springframework.web.bind.annotation.PostMapping;
// import org.springframework.web.bind.annotation.PutMapping;
// import org.springframework.web.bind.annotation.RequestBody;
// import org.springframework.web.bind.annotation.RequestMapping;
// import org.springframework.web.bind.annotation.RequestParam;
// import org.springframework.web.bind.annotation.RestController;
// import org.springframework.web.multipart.MultipartFile;

// import edu.uth.wms.dto.request.OutboundOrderRequest;
// import edu.uth.wms.dto.response.ApiResponse;
// import edu.uth.wms.dto.response.OutboundOrderResponse;
// import edu.uth.wms.model.enums.OrderStatus;
// import edu.uth.wms.service.impl.OutboundOrderService;
// import jakarta.validation.Valid;
// import lombok.RequiredArgsConstructor;
// import lombok.extern.slf4j.Slf4j;

// @RestController
// @RequestMapping("/api/outbound-orders")
// @Slf4j
// @RequiredArgsConstructor
// public class OutboundOrderController {

//     private final OutboundOrderService outboundOrderService;

//     /**
//      * Tạo đơn xuất kho thủ công
//      */
//     @PostMapping
//     public ResponseEntity<ApiResponse<OutboundOrderResponse>> createOrder(
//             @RequestBody @Valid OutboundOrderRequest request, @AuthenticationPrincipal UserDetails userDetails) {

//         Long userId = getCurrentUserId(userDetails);
//         OutboundOrderResponse response = outboundOrderService.createOutboundOrder(request, userId);

//         return ResponseEntity.ok(ApiResponse.success(response, "Tạo đơn xuất kho thành công"));
//     }

//     /**
//      * Import từ Excel
//      */
//     @PostMapping("/import")
//     public ResponseEntity<ApiResponse<OutboundOrderResponse>> importFromExcel(@RequestParam("file") MultipartFile file,
//             @RequestParam("customerId") Long customerId, @RequestParam("toName") String toName,
//             @RequestParam("toPhone") String toPhone, @RequestParam("toAddress") String toAddress,
//             @AuthenticationPrincipal UserDetails userDetails) {

//         Long userId = getCurrentUserId(userDetails);
//         OutboundOrderResponse response = outboundOrderService.importFromExcel(file, customerId, toName, toPhone,
//                 toAddress, userId);

//         return ResponseEntity.ok(ApiResponse.success(response, "Import đơn hàng thành công"));
//     }

//     /**
//      * QUAN TRỌNG: Duyệt đơn (Confirm) -> Gọi API Dev 4
//      */
//     @PutMapping("/{orderId}/confirm")
//     public ResponseEntity<ApiResponse<OutboundOrderResponse>> confirmOrder(@PathVariable Long orderId) {
//         OutboundOrderResponse response = outboundOrderService.confirmOrder(orderId);
//         return ResponseEntity.ok(ApiResponse.success(response, "Duyệt đơn thành công"));
//     }

//     /**
//      * Hủy đơn
//      */
//     @PutMapping("/{orderId}/cancel")
//     public ResponseEntity<ApiResponse<OutboundOrderResponse>> cancelOrder(@PathVariable Long orderId,
//             @RequestParam("reason") String reason) {

//         OutboundOrderResponse response = outboundOrderService.cancelOrder(orderId, reason);
//         return ResponseEntity.ok(ApiResponse.success(response, "Hủy đơn thành công"));
//     }

//     /**
//      * Danh sách đơn hàng (có filter)
//      */
//     @GetMapping
//     public ResponseEntity<ApiResponse<Page<OutboundOrderResponse>>> getOrders(
//             @RequestParam(required = false) OrderStatus status, @RequestParam(required = false) Long customerId,
//             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
//             @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
//             @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

//         Page<OutboundOrderResponse> orders = outboundOrderService.getOrders(status, customerId, fromDate, toDate, page,
//                 size);

//         return ResponseEntity.ok(ApiResponse.success(orders, "Lấy danh sách đơn hàng thành công"));
//     }

//     /**
//      * Chi tiết đơn hàng
//      */
//     @GetMapping("/{orderId}")
//     public ResponseEntity<ApiResponse<OutboundOrderResponse>> getOrderDetail(@PathVariable Long orderId) {
//         OutboundOrderResponse response = outboundOrderService.getOrderDetail(orderId);
//         return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết đơn hàng thành công"));
//     }

//     private Long getCurrentUserId(UserDetails userDetails) {
//         // Logic lấy user ID từ UserDetails
//         return 1L; // Placeholder
//     }
// }

package edu.uth.wms.controller;

import java.time.LocalDateTime;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.request.OutboundOrderRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.service.impl.OutboundOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/outbound-orders")
@RequiredArgsConstructor
@Slf4j
public class OutboundOrderController {

    private final OutboundOrderService outboundOrderService;

    /**
     * Tạo đơn xuất kho thủ công
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> createOrder(
            @RequestBody @Valid OutboundOrderRequest request, @AuthenticationPrincipal UserDetails userDetails) {

        log.info("API: Tạo đơn xuất kho cho customer ID: {}", request.getCustomerId());

        Long userId = getCurrentUserId(userDetails);
        OutboundOrderResponse response = outboundOrderService.createOutboundOrder(request, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo đơn xuất kho thành công"));
    }

    /**
     * Import đơn hàng từ file Excel
     */
    @PostMapping("/import")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> importFromExcel(@RequestParam("file") MultipartFile file,
            @RequestParam("customerId") Long customerId, @RequestParam("toName") String toName,
            @RequestParam("toPhone") String toPhone, @RequestParam("toAddress") String toAddress,
            @AuthenticationPrincipal UserDetails userDetails) {

        log.info("API: Import đơn hàng từ Excel cho customer ID: {}", customerId);

        Long userId = getCurrentUserId(userDetails);
        OutboundOrderResponse response = outboundOrderService.importFromExcel(file, customerId, toName, toPhone,
                toAddress, userId);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Import đơn hàng thành công"));
    }

    /**
     * Duyệt đơn hàng (Confirm)
     */
    @PutMapping("/{orderId}/confirm")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> confirmOrder(@PathVariable Long orderId) {

        log.info("API: Duyệt đơn hàng ID: {}", orderId);

        OutboundOrderResponse response = outboundOrderService.confirmOrder(orderId);

        return ResponseEntity.ok(ApiResponse.success(response, "Duyệt đơn hàng thành công"));
    }

    /**
     * Hủy đơn hàng
     */
    @PutMapping("/{orderId}/cancel")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> cancelOrder(@PathVariable Long orderId,
            @RequestParam("reason") String reason) {

        log.info("API: Hủy đơn hàng ID: {}, lý do: {}", orderId, reason);

        OutboundOrderResponse response = outboundOrderService.cancelOrder(orderId, reason);

        return ResponseEntity.ok(ApiResponse.success(response, "Hủy đơn hàng thành công"));
    }

    /**
     * Lấy danh sách đơn hàng (có filter và phân trang)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<OutboundOrderResponse>>> getOrders(
            @RequestParam(required = false) OrderStatus status, @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

        log.info("API: Lấy danh sách đơn hàng - page: {}, size: {}", page, size);

        Page<OutboundOrderResponse> orders = outboundOrderService.getOrders(status, customerId, fromDate, toDate, page,
                size);

        return ResponseEntity.ok(ApiResponse.success(orders, "Lấy danh sách thành công"));
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<ApiResponse<OutboundOrderResponse>> getOrderDetail(@PathVariable Long orderId) {

        log.info("API: Lấy chi tiết đơn hàng ID: {}", orderId);

        OutboundOrderResponse response = outboundOrderService.getOrderDetail(orderId);

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy chi tiết đơn hàng thành công"));
    }

    /**
     * Helper method để lấy User ID từ UserDetails TODO: Implement logic thực tế khi
     * có Spring Security
     */
    private Long getCurrentUserId(UserDetails userDetails) {
        // Tạm thời return hardcode, sau này sẽ lấy từ JWT/Session
        if (userDetails == null) {
            return 1L; // Default admin user
        }

        // Giả sử username là email hoặc có thể parse ra ID
        // String username = userDetails.getUsername();
        // return userRepository.findByUsername(username).getId();

        return 1L; // Placeholder
    }
}
