package edu.uth.wms.service;

import edu.uth.wms.dto.response.PoDetailResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

public interface IPurchaseOrderService {
    // Import đơn hàng từ Excel
    PurchaseOrderResponse createPoFromExcel(MultipartFile file, Long supplierId);

    // Lấy tất cả đơn hàng (cho danh sách hiển thị Web Admin)
    List<PurchaseOrderResponse> getAllPurchaseOrders();

    // Lấy chi tiết 1 đơn hàng
    PurchaseOrderResponse getPurchaseOrderById(Long id);

    List<PoDetailResponse> getPODetailByIdforStaff(Long id);
}