package edu.uth.wms.service;

import edu.uth.wms.dto.response.PoDetailResponse;
import edu.uth.wms.dto.response.PurchaseOrderForStaffResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import edu.uth.wms.dto.response.PurchaseOrderResponse;

public interface IPurchaseOrderService {
    //============ FOR MANAGER =============
    // Import đơn hàng từ Excel
    PurchaseOrderResponse createPoFromExcel(MultipartFile file, Long supplierId);
    // Lấy tất cả đơn hàng (cho danh sách hiển thị Web Admin)
    List<PurchaseOrderResponse> getAllPurchaseOrders();

    List<PurchaseOrderForStaffResponse> getAllPurchaseOrdersForStaff();

    // Lấy chi tiết 1 đơn hàng
    PurchaseOrderResponse getPurchaseOrderById(Long id);

    PurchaseOrderResponse cancelPurchaseOrder(Long id);


}