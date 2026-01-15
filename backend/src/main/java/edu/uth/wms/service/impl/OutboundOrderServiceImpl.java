package edu.uth.wms.service.impl;

import edu.uth.wms.dto.internal.OutboundExcelItem;
import edu.uth.wms.dto.request.OutboundItemRequest;
import edu.uth.wms.dto.request.OutboundOrderRequest;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.Customer;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.*;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.repository.ICustomerRepository;
import edu.uth.wms.repository.IOutboundDetailRepository;

import edu.uth.wms.repository.*;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.service.IOutboundOrderService;
import edu.uth.wms.service.utils.ExcelHelper;

import lombok.RequiredArgsConstructor;

import org.springframework.transaction.annotation.Transactional;

import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
public class OutboundOrderServiceImpl implements IOutboundOrderService {

    private final IOutboundOrderRepository outboundOrderRepository;

    private final IOutboundDetailRepository detailRepository;

    private final IProductRepository productRepository;

    private final ICustomerRepository customerRepository;

    private final IUserRepository userRepository;
    // private final InventoryAllocationService inventoryAllocationService; //
    // Service gọi API Dev 4

    private final ExcelHelper excelService;



    @Override
    @Transactional(readOnly = true)
    public List<OutboundOrderResponse> getAllOrders() {
        // Gọi Database lấy list -> Map sang DTO bằng hàm chung -> Trả về
        return outboundOrderRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }


    @Override
    public OutboundOrderResponse getOutboundOrderById(Long id) {
        OutboundOrder order = outboundOrderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại với ID: " + id));
        return mapToResponse(order);
    }

    /**
     * Tạo đơn xuất kho thủ công
     */

    @Override
    public OutboundOrderResponse createOutboundOrder(OutboundOrderRequest request, String username) {
        log.info("Tạo đơn xuất kho cho customer ID: {}", request.getCustomerId());
        // 1. Validate dữ liệu
        Customer customer = customerRepository.findById(request.getCustomerId()).orElseThrow(
                () -> new ResourceNotFoundException("Khách hàng không tồn tại với ID " + request.getCustomerId()));

        User createdBy = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User" + username + " không tồn tại."));

        // 2. Tạo OutboundOrder
        OutboundOrder order = OutboundOrder.builder().orderNumber(generateOrderNumber()).status(OrderStatus.NEW)
                .customer(customer).toName(request.getToName()).toPhone(request.getToPhone())
                .toAddress(request.getToAddress()).createdBy(createdBy).details(new ArrayList<>()) // ✅ KHỞI TẠO RÕ RÀNG
                .build();

        // 3. Tạo OutboundDetail
        for (OutboundItemRequest itemRequest : request.getItems()) {
            Products product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Sản phẩm không tồn tại với ID: " + itemRequest.getProductId()));

            OutboundDetail detail = OutboundDetail.builder().product(product).requestedQty(itemRequest.getQuantity())
                    .allocatedQty(0).build();

            order.addDetail(detail);
        }

        // 4. Lưu database
        OutboundOrder savedOrder = outboundOrderRepository.save(order);

        log.info("Đã tạo đơn xuất kho: {}", savedOrder.getOrderNumber());

        return mapToResponse(savedOrder);
    }

    /**
     * Import đơn hàng từ Excel (Bulk Order)
     */
    @Override
    public OutboundOrderResponse importFromExcel(MultipartFile file, Long customerId, String toName, String toPhone,
                                                 String toAddress, String username) {

        log.info("Import đơn hàng từ Excel cho customer ID: {}", customerId);
        try {
            // 1. Đọc Excel
            List<OutboundExcelItem> excelItems = excelService.excelToOutboundItems(file.getInputStream());

            if (excelItems.isEmpty()) {
                throw new ResourceNotFoundException("File Excel không có dữ liệu hợp lệ");
            }

            // 2. Validate sản phẩm và map sang OutboundDetailRequest
            List<OutboundItemRequest> items = excelItems.stream().map(excelItem -> {
                Products product = productRepository.findBySku(excelItem.getSku())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Sản phẩm SKU '" + excelItem.getSku() + "' không tồn tại trong hệ thống"));

                return OutboundItemRequest.builder().productId(product.getId()).quantity(excelItem.getQuantity())
                        .build();
            }).collect(Collectors.toList());

            // 3. Tạo đơn hàng
            OutboundOrderRequest request = OutboundOrderRequest.builder().customerId(customerId).toName(toName)
                    .toPhone(toPhone).toAddress(toAddress).items(items).build();

            return createOutboundOrder(request, username);

        } catch (IOException e) {
            log.error("Lỗi khi import Excel: ", e);
            throw new RuntimeException("Lỗi đọc file Excel: " + e.getMessage());
        }
    }

    /**
     * QUAN TRỌNG NHẤT: Duyệt đơn và gọi API Dev 4 để Allocate hàng
     */
    @Override
    public OutboundOrderResponse confirmOrder(Long orderId) {
        log.info("Duyệt đơn hàng ID: {}", orderId);
        // 1. Lấy đơn hàng
        OutboundOrder order = outboundOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        // 2. Kiểm tra trạng thái
        if (order.getStatus() != OrderStatus.NEW) {
            throw new RuntimeException("Chỉ được duyệt đơn ở trạng thái NEW");
        }
        // TODO: GỌI API CỦA DEV 4 ĐỂ ALLOCATE HÀNG
        // Hiện tại tạm thời chuyển trạng thái trực tiếp

        // Giả lập phân bổ thành công
        for (OutboundDetail detail : order.getDetails()) {
            detail.setAllocatedQty(detail.getRequestedQty());
        }

        // 3. Cập nhật trạng thái
        order.setStatus(OrderStatus.ALLOCATED);
        OutboundOrder savedOrder = outboundOrderRepository.save(order);

        log.info("Đơn hàng {} đã được duyệt thành công", order.getOrderNumber());

        return mapToResponse(savedOrder);

        // 3. Chuẩn bị request gửi cho Dev 4
        // AllocationRequest allocationRequest = new AllocationRequest();
        // allocationRequest.setOrderNumber(order.getOrderNumber());

        // List<AllocationItemRequest> allocationItems = new ArrayList<>();
        // for (OutboundDetail detail : order.getDetails()) {
        // AllocationItemRequest item = new AllocationItemRequest();
        // item.setProductId(detail.getProduct().getId());
        // item.setQuantity(detail.getRequestedQty());
        // allocationItems.add(item);
        // }
        // allocationRequest.setItems(allocationItems);

        // // 4. GỌI API CỦA DEV 4 (Thiên)
        // try {
        // AllocationResponse allocationResponse =
        // inventoryAllocationService.allocateInventory(allocationRequest);

        // // 5. Xử lý phản hồi
        // if (allocationResponse.isSuccess()) {
        // // Thành công -> Cập nhật số lượng allocated
        // for (AllocationItemResult result : allocationResponse.getResults()) {
        // OutboundDetail detail = order.getDetails().stream()
        // .filter(d ->
        // d.getProduct().getId().equals(result.getProductId())).findFirst()
        // .orElseThrow();

        // detail.setAllocatedQty(result.getAllocatedQty());
        // }

        // // Cập nhật trạng thái đơn
        // order.setStatus(OrderStatus.ALLOCATED);
        // outboundOrderRepository.save(order);

        // log.info("Đơn hàng {} đã được phân bổ thành công", order.getOrderNumber());

        // return mapToResponse(order);

        // } else {
        // // Thất bại -> Báo lỗi
        // throw new RuntimeException("Kho không đủ hàng: " +
        // allocationResponse.getMessage());
        // }

        // } catch (Exception e) {
        // log.error("Lỗi khi gọi API Allocation: ", e);
        // throw new RuntimeException("Lỗi kết nối với hệ thống kho: " +
        // e.getMessage());
        // }
    }

    /**
     * Hủy đơn hàng và nhả hàng (Un-allocate)
     */
    @Override
    public OutboundOrderResponse cancelOrder(Long orderId, String reason) {
        log.info("Hủy đơn hàng ID: {}, lý do: {}", orderId, reason);

        // ✅ CHECK 1: Validate reason không rỗng
        if (reason == null || reason.trim().isEmpty()) {
            throw new BadRequestException("Lý do hủy không được để trống");
        }

        // ✅ CHECK 2: Tìm order
        OutboundOrder order = outboundOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại với ID: " + orderId));

        // ✅ CHECK 3: Validate status có thể hủy không
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng đã được hủy trước đó");
        }

        if (order.getStatus() == OrderStatus.COMPLETED || order.getStatus() == OrderStatus.SHIPPED) {
            throw new BadRequestException("Không thể hủy đơn hàng ở trạng thái: " + order.getStatus());
        }

        // // // 3. Nếu đơn đã ALLOCATED thì phải gọi API Dev 4 để nhả hàng
        // // if (order.getStatus() == OrderStatus.ALLOCATED || order.getStatus() ==
        // // OrderStatus.PICKING) {
        // // try {
        // // inventoryAllocationService.unallocateInventory(order.getOrderNumber());
        // // log.info("Đã nhả hàng cho đơn {}", order.getOrderNumber());
        // // } catch (Exception e) {
        // // log.error("Lỗi khi nhả hàng: ", e);
        // // throw new RuntimeException("Lỗi khi nhả hàng: " + e.getMessage());
        // // }
        // // }

        // ✅ CHECK 4: Update status
        order.setStatus(OrderStatus.CANCELLED);

        // TODO: Lưu reason vào bảng order_history hoặc notes
        // order.setNotes(order.getNotes() + "\nLý do hủy: " + reason);

        OutboundOrder cancelledOrder = outboundOrderRepository.save(order);

        log.info("Đã hủy đơn hàng ID: {}", orderId);

        return mapToResponse(cancelledOrder);
    }

    /**
     * Lấy danh sách đơn hàng (có filter)
     */
    public Page<OutboundOrderResponse> getOrders(OrderStatus status, Long customerId, LocalDateTime fromDate,
                                                 LocalDateTime toDate, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdDate").descending());

        Page<OutboundOrder> orders = outboundOrderRepository.filterOrders(status, customerId, fromDate, toDate,
                pageable);

        return orders.map(this::mapToResponse);
    }

    /**
     * Lấy chi tiết đơn hàng
     */
    @Override
    public OutboundOrderResponse getOrderDetail(Long orderId) {
        OutboundOrder order = outboundOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        return mapToResponse(order);
    }

    /**
     * Sinh mã đơn hàng tự động
     */
    private String generateOrderNumber() {
        String prefix = "OUT";
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        // Lấy số thứ tự trong ngày
        long count = outboundOrderRepository.count() + 1;
        String seqPart = String.format("%05d", count);

        return prefix + datePart + seqPart;
    }

    /**
     * Map Entity sang Response DTO
     */
//    private OutboundOrderResponse mapToResponse(OutboundOrder order) {
//        OutboundOrderResponse response = OutboundOrderResponse.builder().id(order.getId())
//                .orderNumber(order.getOrderNumber()).status(order.getStatus())
//                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
//                .toName(order.getToName()).toPhone(order.getToPhone()).toAddress(order.getToAddress())
//                .createdDate(order.getCreatedDate())
//                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
//                .assignedPickerName(order.getAssignedPicker() != null ? order.getAssignedPicker().getFullName() : null)
//                .build();
//
//        List<OutboundDetailResponse> detailResponses = order.getDetails().stream().map(detail -> {
//            return OutboundDetailResponse.builder().id(detail.getId()).productName(detail.getProduct().getName())
//                    .productSku(detail.getProduct().getSku()).requestedQty(detail.getRequestedQty())
//                    .allocatedQty(detail.getAllocatedQty()).build();
//        }).collect(Collectors.toList());
//
//        response.setDetails(detailResponses);
//
//        return response;
//    }
    private OutboundOrderResponse mapToResponse(OutboundOrder order) {

        // 1. Map danh sách chi tiết (Để xem được món gì, bao nhiêu cái)
        List<OutboundDetailResponse> detailResponses = new ArrayList<>();
        if (order.getDetails() != null) {
            detailResponses = order.getDetails().stream()
                    .map(d -> OutboundDetailResponse.builder()
                            .id(d.getId())
                            .productId(d.getProduct().getId())
                            .productSku(d.getProduct().getSku())
                            .productName(d.getProduct().getName())
                            // Ưu tiên hiện số thực tế (allocated), nếu chưa có thì hiện số yêu cầu
                            .requestedQty(d.getRequestedQty())
                            .allocatedQty(d.getAllocatedQty() != null ? d.getAllocatedQty() : 0)
                            .build())
                    .collect(Collectors.toList());
        }

        // 2. Tính tổng số lượng (để hiển thị thống kê nhanh trên bảng)
        int totalQty = 0;
        if (order.getDetails() != null) {
            totalQty = order.getDetails().stream()
                    .mapToInt(d -> (d.getAllocatedQty() != null && d.getAllocatedQty() > 0)
                            ? d.getAllocatedQty()
                            : d.getRequestedQty())
                    .sum();
        }

        // 3. Build DTO trả về
        return OutboundOrderResponse.builder()
                .id(order.getId())
                .orderNumber(order.getOrderNumber())
                .status(order.getStatus())

                // Map thông tin khách hàng/người nhận
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                .toName(order.getToName())
                .toPhone(order.getToPhone())
                .toAddress(order.getToAddress())

                // Map thông tin User
                .createdDate(order.getCreatedDate())
                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .assignedPickerName(order.getAssignedPicker() != null ? order.getAssignedPicker().getFullName() : null)

                // Các chỉ số thống kê (Nếu DTO của bạn có field này thì bỏ comment ra)
                // .totalItems(order.getDetails() != null ? order.getDetails().size() : 0)
                // .totalQuantity(totalQty)

                // ✅ Danh sách chi tiết hàng hóa (Cái bạn cần nhất)
                .details(detailResponses)

                .build();
    }
}