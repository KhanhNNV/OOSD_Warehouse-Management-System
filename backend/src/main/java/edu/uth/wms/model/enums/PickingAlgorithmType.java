package edu.uth.wms.model.enums;

/**
 * Enum định nghĩa các loại thuật toán xuất kho
 * Được sử dụng bởi Admin để cấu hình chiến lược xuất kho toàn hệ thống
 */
public enum PickingAlgorithmType {
    /**
     * FIFO - First In First Out
     * Xuất hàng nhập trước ra trước
     * Ưu tiên theo thời gian nhập kho (manufacture_date cũ nhất)
     */
    FIFO,
    
    /**
     * FEFO - First Expired First Out  
     * Xuất hàng hết hạn trước ra trước
     * Ưu tiên theo ngày hết hạn (expiry_date gần nhất)
     */
    FEFO
}