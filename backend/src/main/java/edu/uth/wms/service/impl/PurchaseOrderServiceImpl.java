package edu.uth.wms.service.impl;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import edu.uth.wms.dto.response.PoDetailForStaffResponse;
import edu.uth.wms.dto.response.PurchaseOrderForStaffResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.*;
import edu.uth.wms.repository.IUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.internal.PoExcelItem;
import edu.uth.wms.dto.response.PoDetailResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.model.enums.POStatus;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.repository.ISupplierRepository;
import edu.uth.wms.service.utils.ExcelHelper;
import edu.uth.wms.service.utils.SecurityUtils;
import edu.uth.wms.service.IPurchaseOrderService;
import edu.uth.wms.service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import static edu.uth.wms.service.utils.SecurityUtils.getCurrentUserLogin;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements IPurchaseOrderService {

    private final IPurchaseOrderRepository poRepository;
    private final IProductRepository productRepository;
    private final ISupplierRepository supplierRepository;
    private final ExcelHelper excelHelper;
    private final IUserRepository userRepository;

    @Override
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return poRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public List<PurchaseOrderForStaffResponse> getAllPurchaseOrdersForStaff() {
        return poRepository.findAll().stream().map(this::toStaffDto).collect(Collectors.toList());
    }


    @Override
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Đơn hàng ID: " + id));
        return toDto(po);
    }

    @Override
    @Transactional
    public PurchaseOrderResponse cancelPurchaseOrder(Long id) {
        // 1. Tìm PO
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Đơn hàng ID: " + id));

        // 2. Validate logic: Chỉ hủy được khi còn Mới (NEW)
        if (po.getStatus() != POStatus.NEW) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng ở trạng thái MỚI (NEW). " +
                    "Đơn hàng hiện tại đang xử lý hoặc đã hoàn thành.");
        }

        // 3. Cập nhật trạng thái
        po.setStatus(POStatus.CANCELLED);

        // Ghi lại ai là người hủy (Optional - nếu entity có field updatedBy)
        // po.setUpdatedBy(userRepository.findByUsername(getCurrentUserLogin()).orElse(null));

        PurchaseOrder savedPo = poRepository.save(po);
        return toDto(savedPo);
    }


    /**
     * Logic: Import Excel -> Validate SKU -> Tạo PO & PODetails
     */
    @Override
    @Transactional
    public PurchaseOrderResponse createPoFromExcel(MultipartFile file, Long supplierId) {

        String users=getCurrentUserLogin();
        System.out.println(users);

        User user = userRepository.findByUsername(getCurrentUserLogin())
                .orElseThrow(() -> new ResourceNotFoundException("User không tồn tại!"));

        // 1. Kiểm tra Nhà cung cấp
        Suppliers supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhà cung cấp ID: " + supplierId));

        // 2. Đọc file Excel thành list items thô (SKU, Qty)
        if (!excelHelper.hasExcelFormat(file)) {
            throw new RuntimeException("File không đúng định dạng Excel");
        }

        List<PoExcelItem> excelItems;
        try {
            excelItems = excelHelper.excelToPoItems(file.getInputStream());
        } catch (IOException e) {
            throw new RuntimeException("Lỗi IO đọc file");
        }

        if (excelItems.isEmpty()) {
            throw new RuntimeException("File Excel rỗng hoặc không đọc được dữ liệu");
        }

        // 3. Khởi tạo PO Header
        PurchaseOrder po = new PurchaseOrder();
        po.setPoNumber(generatePoNumber()); // Hàm sinh mã tự động (viết ở dưới)
        po.setSupplier(supplier);
        po.setCreatedBy(user);
        po.setStatus(POStatus.NEW); // Trạng thái ban đầu theo PDF
        po.setCreatedAt(LocalDateTime.now());
        po.setDetails(new ArrayList<>()); // Init list để add dần

        // 4. Loop qua từng item Excel để Validate và Map vào Entity
        for (PoExcelItem item : excelItems) {
            // Tìm Product bằng SKU (Query Database)
            // LƯU Ý: Với 1000 items, nên query 1 lần (findBySkuIn) để tối ưu. Ở đây code
            // simple query loop.
            Products product = productRepository.findBySku(item.getSku()).orElseThrow(() -> new RuntimeException(
                    "Lỗi tại dòng SKU '" + item.getSku() + "': Sản phẩm không tồn tại trong hệ thống (Master Data)!"));

            // Tạo PODetail Entity
            PODetail detail = new PODetail();
            detail.setProduct(product);
            detail.setExpectedQty(item.getQuantity());
            detail.setPurchaseOrder(po); // Set quan hệ 2 chiều

            po.getDetails().add(detail);
        }

        // 5. Lưu PO (Cascade ALL sẽ tự lưu PODetails)
        PurchaseOrder savedPo = poRepository.save(po);

        // 6. Map sang DTO Response để trả về Frontend
        return toDto(savedPo);
    }

    // --- Hàm phụ trợ ---

    // Sinh mã PO ngẫu nhiên theo ngày: PO-20260102-1234
    private String generatePoNumber() {
        return "PO-" + System.currentTimeMillis();
        // Trong thực tế sẽ là: LocalDate.now().toString() + ...
    }


    private PurchaseOrderResponse toDto(PurchaseOrder po) {
        // 1. Map danh sách Details
        List<PoDetailResponse> detailsDto = new ArrayList<>();
        if (po.getDetails() != null && !po.getDetails().isEmpty()) {
            detailsDto = po.getDetails().stream()
                    .map(d -> PoDetailResponse.builder()
                            .id(d.getId())
                            .productId(d.getProduct().getId())
                            .productSku(d.getProduct().getSku())
                            .productName(d.getProduct().getName())
                            .expectedQty(d.getExpectedQty())
                            .build())
                    .collect(Collectors.toList());
        }

        // 2. Tính toán tổng
        int totalQty = detailsDto.stream().mapToInt(PoDetailResponse::getExpectedQty).sum();

        // 3. Build Response
        return PurchaseOrderResponse.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierName(po.getSupplier() != null ? po.getSupplier().getName() : "N/A")
                .status(po.getStatus().name())
                .createdAt(po.getCreatedAt() != null ? po.getCreatedAt().toString() : null)
                // Fix: Lấy thông tin từ User entity thay vì Supplier
                .createdBy(po.getCreatedBy() != null ? po.getCreatedBy().getUsername() : "System")
                .createdByName(po.getCreatedBy() != null ? po.getCreatedBy().getFullName() : "System")
                .totalItems(detailsDto.size())
                .totalQuantity(totalQty)
                .details(detailsDto) // <-- Trả về list detail ở đây
                .build();
    }

    private PurchaseOrderForStaffResponse toStaffDto(PurchaseOrder po) {
        // 1. Map danh sách Details
        List<PoDetailForStaffResponse> detailsDto = new ArrayList<>();
        if (po.getDetails() != null && !po.getDetails().isEmpty()) {
            detailsDto = po.getDetails().stream()
                    .map(d -> PoDetailForStaffResponse.builder()
                            .id(d.getId())
                            .productId(d.getProduct().getId())
                            .productSku(d.getProduct().getSku())
                            .productName(d.getProduct().getName())
                            .build())
                    .collect(Collectors.toList());
        }

        // 3. Build Response
        return PurchaseOrderForStaffResponse.builder()
                .id(po.getId())
                .poNumber(po.getPoNumber())
                .supplierName(po.getSupplier() != null ? po.getSupplier().getName() : "N/A")
                .status(po.getStatus().name())
                .createdAt(po.getCreatedAt() != null ? po.getCreatedAt().toString() : null)
                .createdBy(po.getCreatedBy() != null ? po.getCreatedBy().getUsername() : "System")
                .createdByName(po.getCreatedBy() != null ? po.getCreatedBy().getFullName() : "System")
                .totalItems(detailsDto.size())
                .details(detailsDto) // <-- Trả về list detail ở đây
                .build();
    }


}
