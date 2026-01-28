package edu.uth.wms.service.impl;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.PickingAlgorithmType;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IStocktakeService;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.strategy.PickingStrategy;
import edu.uth.wms.service.strategy.PickingStrategyFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.internal.OutboundExcelItem;
import edu.uth.wms.dto.request.OutboundItemRequest;
import edu.uth.wms.dto.request.OutboundOrderRequest;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.dto.response.OutboundOrderResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.service.IOutboundOrderService;
import edu.uth.wms.service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class OutboundOrderServiceImpl implements IOutboundOrderService {

    private final IOutboundOrderRepository outboundOrderRepository;

    private final IOutboundDetailRepository detailRepository;

    private final IOutboundNoteRepository outboundNoteRepository;

    private final IProductRepository productRepository;

    private final ICustomerRepository customerRepository;

    private final IUserRepository userRepository;

    private final ExcelHelper excelService;
    private final IInventoryRepository inventoryRepo;
    private final ISystemConfigService configService;
    private final PickingStrategyFactory strategyFactory;
    private final IStocktakeService stocktakeService;

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
    @Transactional
    public OutboundOrderResponse confirmOrder(Long orderId) {
        log.info("Duyệt đơn hàng ID: {}", orderId);
        // 1. Lấy đơn hàng
        OutboundOrder order = outboundOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Đơn hàng không tồn tại"));

        // 2. Kiểm tra trạng thái
        if (order.getStatus() != OrderStatus.NEW) {
            throw new BadRequestException("Chỉ được duyệt đơn ở trạng thái NEW");
        }

        // Lấy chiến lược (Strategy) hiện tại (FIFO/FEFO)
        PickingAlgorithmType currentAlgo = configService.getCurrentAlgorithm();
        PickingStrategy strategy = strategyFactory.getStrategy(currentAlgo);

        for (OutboundDetail detail : order.getDetails()) {
            Products product = productRepository.findById(detail.getProduct().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + detail.getProduct().getId()));

            // 3.1. Lấy tất cả tồn kho của sản phẩm
            List<Inventory> inventories = inventoryRepo.findAllByProductId(product.getId());

            // 3.2. Chạy thuật toán để tìm các kệ phù hợp
            List<Inventory> suggestedInventories = strategy.suggestPickingOrder(product, detail.getRequestedQty(), inventories);

            // 3.3. Nếu thuật toán trả về rỗng -> Không đủ hàng
            if (suggestedInventories.isEmpty()) {
                throw new ResourceNotFoundException("Không đủ tồn kho khả dụng cho sản phẩm: " + product.getSku() + " (Cần: " + detail.getRequestedQty() + ")");
            }

            // 3.4. THỰC HIỆN KHÓA HÀNG (Tăng quantityAllocated)
            int remainingToLock = detail.getRequestedQty();

            for (Inventory inv : suggestedInventories) {
                if (remainingToLock <= 0) break;

                String locationCode = inv.getLocation().getCode();

                if (stocktakeService.isLocationLocked(locationCode)) {
                    // Ném lỗi ngay lập tức để dừng quy trình
                    throw new BadRequestException(String.format(
                            "Không thể duyệt đơn! Sản phẩm %s đang nằm tại vị trí %s đang bị KHÓA để kiểm kê.",
                            product.getSku(), locationCode
                    ));
                }

                // Tính số lượng khả dụng tại kệ này (Tổng - Đã khóa)
                int currentAllocated = inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated();
                int availableAtLoc = inv.getQuantity() - currentAllocated;

                // Lấy số lượng cần khóa từ kệ này (min giữa cần lấy và có sẵn)
                int lockQty = Math.min(remainingToLock, availableAtLoc);

                if (lockQty > 0) {
                    inv.setQuantityAllocated(currentAllocated + lockQty);
                    inventoryRepo.save(inv);

                    remainingToLock -= lockQty;

                    log.info("[LOCK] Đã giữ chỗ {} {} tại kệ {}", lockQty, product.getSku(), inv.getLocation().getCode());
                }
            }

            // 3.5. Kiểm tra lại nếu vẫn chưa lock đủ (Logic an toàn)
            if (remainingToLock > 0) {
                throw new RuntimeException("Lỗi hệ thống: Không thể giữ chỗ đủ số lượng cho " + product.getSku());
            }

            detail.setAllocatedQty(detail.getRequestedQty());

        }

        order.setStatus(OrderStatus.ALLOCATED); // Cập nhật trạng thái: ĐÃ GIỮ CHỖ

        // --- BƯỚC 4: Lưu database ---
        OutboundOrder savedOrder = outboundOrderRepository.save(order);

        log.info("[CREATE ORDER] Đã tạo và giữ chỗ thành công đơn: {}", savedOrder.getOrderNumber());

        return mapToResponse(savedOrder);

    }


    /**
     * Hủy đơn hàng và nhả hàng (Un-allocate)
     */
    @Override
    public OutboundOrderResponse cancelOrder(Long orderId, String reason) {
        log.info("Hủy đơn hàng ID: {}, lý do: {}", orderId, reason);

        // ✅ CHECK 1: Validate reason không rỗng
        // if (reason == null || reason.trim().isEmpty()) {
        // throw new BadRequestException("Lý do hủy không được để trống");
        // }

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
    @Override
    @Transactional(readOnly = true)
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
    private OutboundOrderResponse mapToResponse(OutboundOrder order) {
        OutboundOrderResponse response = OutboundOrderResponse.builder().id(order.getId())
                .orderNumber(order.getOrderNumber()).status(order.getStatus())
                .customerName(order.getCustomer() != null ? order.getCustomer().getName() : null)
                .toName(order.getToName()).toPhone(order.getToPhone()).toAddress(order.getToAddress())
                .createdDate(order.getCreatedDate())
                .createdByName(order.getCreatedBy() != null ? order.getCreatedBy().getFullName() : null)
                .assignedPickerName(order.getAssignedPicker() != null ? order.getAssignedPicker().getFullName() : null)
                .build();


        List<OutboundDetailResponse> detailResponses = order.getDetails().stream().map(detail -> {
            return OutboundDetailResponse.builder().id(detail.getId()).productName(detail.getProduct().getName())
                    .productSku(detail.getProduct().getSku()).requestedQty(detail.getRequestedQty())
                    .build();
        }).collect(Collectors.toList());

        response.setDetails(detailResponses);

        return response;
    }

}