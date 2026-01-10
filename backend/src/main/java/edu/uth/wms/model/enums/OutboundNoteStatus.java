package edu.uth.wms.model.enums;

/**
 * Trạng thái của Phiếu Xuất Kho (Outbound Note)
 */
public enum OutboundNoteStatus {
    /**
     * Nháp - Chưa xuất
     */
    DRAFT,
    
    /**
     * Đã đóng gói - Sẵn sàng xuất
     */
    PACKED,
    
    /**
     * Đã hoàn tất xuất kho
     */
    COMPLETED,
    
    /**
     * Đã hủy
     */
    CANCELLED
}