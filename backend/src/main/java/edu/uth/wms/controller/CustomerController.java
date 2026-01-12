package edu.uth.wms.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.uth.wms.dto.request.CustomerRequest;
import edu.uth.wms.dto.response.ApiResponse;
import edu.uth.wms.dto.response.CustomerResponse;
import edu.uth.wms.model.enums.CustomerType;
import edu.uth.wms.service.impl.CustomerServiceImpl;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/customers")
@RequiredArgsConstructor
@Slf4j
public class CustomerController {

    private final CustomerServiceImpl customerService;

    /**
     * Tạo khách hàng mới
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CustomerResponse>> createCustomer(@RequestBody @Valid CustomerRequest request,
            Authentication authentication) {

        log.info("API: Tạo khách hàng mới: {}", request.getName());

        String userName = authentication.getName();
        CustomerResponse response = customerService.createCustomer(request, userName);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Tạo khách hàng thành công"));
    }

    /**
     * Cập nhật thông tin khách hàng
     */
    @PutMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponse>> updateCustomer(@PathVariable Long customerId,
            @RequestBody @Valid CustomerRequest request) {

        log.info("API: Cập nhật khách hàng ID: {}", customerId);

        CustomerResponse response = customerService.updateCustomer(customerId, request);

        return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật khách hàng thành công"));
    }

    /**
     * Xóa khách hàng (Soft delete)
     */
    @DeleteMapping("/{customerId}")
    public ResponseEntity<ApiResponse<Void>> deleteCustomer(@PathVariable Long customerId) {
        log.info("API: Xóa khách hàng ID: {}", customerId);

        customerService.deleteCustomer(customerId);

        return ResponseEntity.ok(ApiResponse.success(null, "Xóa khách hàng thành công"));
    }

    /**
     * Kích hoạt lại khách hàng
     */
    @PutMapping("/{customerId}/activate")
    public ResponseEntity<ApiResponse<CustomerResponse>> activateCustomer(@PathVariable Long customerId) {
        log.info("API: Kích hoạt khách hàng ID: {}", customerId);

        CustomerResponse response = customerService.activateCustomer(customerId);

        return ResponseEntity.ok(ApiResponse.success(response, "Kích hoạt khách hàng thành công"));
    }

    /**
     * Lấy chi tiết khách hàng
     */
    @GetMapping("/{customerId}")
    public ResponseEntity<ApiResponse<CustomerResponse>> getCustomerById(@PathVariable Long customerId) {
        log.info("API: Lấy chi tiết khách hàng ID: {}", customerId);

        CustomerResponse response = customerService.getCustomerById(customerId);

        return ResponseEntity.ok(ApiResponse.success(response, "Lấy thông tin khách hàng thành công"));
    }

    /**
     * Lấy danh sách khách hàng (có filter và phân trang)
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> getCustomers(
            @RequestParam(required = false) Boolean isActive, @RequestParam(required = false) CustomerType customerType,
            @RequestParam(required = false) String keyword, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size, @RequestParam(defaultValue = "createdDate") String sortBy) {

        log.info("API: Lấy danh sách khách hàng");

        Page<CustomerResponse> customers = customerService.getCustomers(isActive, customerType, keyword, page, size,
                sortBy);

        return ResponseEntity.ok(ApiResponse.success(customers, "Lấy danh sách khách hàng thành công"));
    }

    /**
     * Tìm kiếm khách hàng
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<Page<CustomerResponse>>> searchCustomers(@RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {

        log.info("API: Tìm kiếm khách hàng: {}", keyword);

        Page<CustomerResponse> customers = customerService.searchCustomers(keyword, page, size);

        return ResponseEntity.ok(ApiResponse.success(customers, "Tìm kiếm thành công"));
    }

    /**
     * Lấy danh sách theo loại khách hàng
     */
    @GetMapping("/by-type/{customerType}")
    public ResponseEntity<ApiResponse<List<CustomerResponse>>> getCustomersByType(
            @PathVariable CustomerType customerType) {

        log.info("API: Lấy danh sách khách hàng loại: {}", customerType);

        List<CustomerResponse> customers = customerService.getCustomersByType(customerType);

        return ResponseEntity.ok(ApiResponse.success(customers, "Lấy danh sách thành công"));
    }

    /**
     * Lấy thống kê tổng quan
     */
    // @GetMapping("/summary")
    // public ResponseEntity<ApiResponse<CustomerResponse>>
    // getAllCustomers() {
    // log.info("API: Lấy thống kê khách hàng");

    // CustomerResponse summary = customerService.getAllCustomers();

    // return ResponseEntity.ok(ApiResponse.success(summary, "Lấy thống kê thành công"));
    // }

    /**
     * Lấy danh sách khách hàng vượt hạn mức tín dụng
     */
    // @GetMapping("/exceeding-credit")
    // public ResponseEntity<ApiResponse<List<CustomerResponse>>>
    // getCustomersExceedingCreditLimit() {
    // log.info("API: Lấy danh sách khách hàng vượt hạn mức");

    // List<CustomerResponse> customers =
    // customerService.getCustomersExceedingCreditLimit();

    // return ResponseEntity.ok(ApiResponse.success(customers, "Lấy danh sách thành
    // công"));
    // }

    /**
     * Lấy danh sách khách hàng gần đạt hạn mức
     */
    // @GetMapping("/near-credit-limit")
    // public ResponseEntity<ApiResponse<List<CustomerResponse>>>
    // getCustomersNearCreditLimit() {
    // log.info("API: Lấy danh sách khách hàng gần đạt hạn mức");

    // List<CustomerResponse> customers =
    // customerService.getCustomersNearCreditLimit();

    // return ResponseEntity.ok(ApiResponse.success(customers, "Lấy danh sách thành
    // công"));
    // }

    /**
     * Cập nhật công nợ khách hàng (Tăng)
     */
    // @PutMapping("/{customerId}/debt/increase")
    // public ResponseEntity<ApiResponse<CustomerResponse>> increaseDebt(
    // @PathVariable Long customerId,
    // @RequestParam Double amount) {

    // log.info("API: Tăng công nợ khách hàng ID: {}", customerId);

    // CustomerResponse response = customerService.updateDebt(customerId, amount,
    // true);

    // return ResponseEntity.ok(ApiResponse.success(response, "Cập nhật công nợ
    // thành công"));
    // }

    /**
     * Cập nhật công nợ khách hàng (Giảm - Thanh toán)
     */
    // @PutMapping("/{customerId}/debt/decrease")
    // public ResponseEntity<ApiResponse<CustomerResponse>> decreaseDebt(
    // @PathVariable Long customerId,
    // @RequestParam Double amount) {

    // log.info("API: Giảm công nợ khách hàng ID: {}", customerId);

    // CustomerResponse response = customerService.updateDebt(customerId, amount,
    // false);

    // return ResponseEntity.ok(ApiResponse.success(response, "Thanh toán thành
    // công"));
    // }

    /**
     * Helper method lấy User ID
     */
    // private Long getCurrentUserId(UserDetails userDetails) {
    // if (userDetails == null) {
    // return 1L; // Default
    // }
    // return 1L; // TODO: Implement actual logic
    // }
}
