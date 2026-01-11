package edu.uth.wms.service.strategy;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Products;

import java.util.List;

/**
 * INTERFACE - LỚP CHA CHO CÁC THUẬT TOÁN XUẤT KHO
 * 
 * Định nghĩa hợp đồng (contract) mà tất cả các thuật toán phải tuân thủ
 * Áp dụng Strategy Pattern để dễ dàng thay đổi thuật toán trong runtime
 */
public interface PickingStrategy {

    /**
     * Gợi ý danh sách kệ hàng để lấy sản phẩm
     * 
     * @param product Sản phẩm cần lấy
     * @param requestedQty Số lượng yêu cầu
     * @param allInventories Danh sách TẤT CẢ các kệ có chứa sản phẩm này
     * 
     * @return Danh sách Inventory đã được sắp xếp theo thứ tự ưu tiên
     *         (Lấy từ inventory đầu tiên trước, nếu không đủ thì lấy tiếp inventory thứ 2...)
     */
    List<Inventory> suggestPickingOrder(
        Products product, 
        Integer requestedQty, 
        List<Inventory> allInventories
    );

    /**
     * Tên thuật toán (Dùng cho logging/debugging)
     */
    String getAlgorithmName();
}