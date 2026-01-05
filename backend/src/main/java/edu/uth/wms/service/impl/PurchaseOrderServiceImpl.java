package edu.uth.wms.service.impl;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.internal.PoExcelItem;
import edu.uth.wms.dto.response.PoDetailResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.model.PODetail;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.PurchaseOrder;
import edu.uth.wms.model.Suppliers;
import edu.uth.wms.model.enums.POStatus;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.repository.ISupplierRepository;
import edu.uth.wms.service.IPurchaseOrderService;
import edu.uth.wms.service.utils.ExcelHelper;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class PurchaseOrderServiceImpl implements IPurchaseOrderService {

    private final IPurchaseOrderRepository poRepository;
    private final IProductRepository productRepository;
    private final ISupplierRepository supplierRepository;
    private final ExcelHelper excelHelper;

    @Override
    public List<PurchaseOrderResponse> getAllPurchaseOrders() {
        return poRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public PurchaseOrderResponse getPurchaseOrderById(Long id) {
        PurchaseOrder po = poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Đơn hàng ID: " + id));
        return toDto(po);
    }

    /**
     * Logic: Import Excel -> Validate SKU -> Tạo PO & PODetails
     */
    @Override
    @Transactional
    public PurchaseOrderResponse createPoFromExcel(MultipartFile file, Long supplierId) {
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

    // Helper Mapping Entity -> Response DTO
    private PurchaseOrderResponse toDto(PurchaseOrder po) {
        List<PoDetailResponse> details = po.getDetails().stream()
                .map(d -> PoDetailResponse.builder().id(d.getId()).productId(d.getProduct().getId())
                        .productSku(d.getProduct().getSku()).productName(d.getProduct().getName())
                        .expectedQty(d.getExpectedQty()).build())
                .collect(Collectors.toList());

        return PurchaseOrderResponse.builder().id(po.getId()).poNumber(po.getPoNumber())
                .supplierName(po.getSupplier() != null ? po.getSupplier().getName() : "Không xác định")
                .status(po.getStatus().name())
                .expectedDate(po.getExpectedDate() != null ? po.getExpectedDate().toString() : null).details(details)
                .totalItems(details.size())
                .totalQuantity(details.stream().mapToInt(PoDetailResponse::getExpectedQty).sum()).build();
    }
}