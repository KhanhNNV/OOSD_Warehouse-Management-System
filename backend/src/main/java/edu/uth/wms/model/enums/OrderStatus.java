package edu.uth.wms.model.enums;

public enum OrderStatus {
    NEW, // Đơn mới tạo
    ALLOCATED, // Đã phân bổ hàng
    PICKING, // Đang lấy hàng
    PACKED, // Đã đóng gói
    SHIPPED, // Đã giao vận
    COMPLETED, // Hoàn thành
    CANCELLED // Đã hủy
}