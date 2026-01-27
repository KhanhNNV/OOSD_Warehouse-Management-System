package edu.uth.wms.model.enums;

/**
 * Trạng thái của phiên kiểm kê (Session).
 * <ul>
 * <li>{@code DRAFT} - Bản nháp, chưa bắt đầu</li>
 * <li>{@code IN_PROGRESS} - Đang tiến hành kiểm kê</li>
 * <li>{@code COMPLETED} - Hoàn thành, không có sai lệch</li>
 * <li>{@code NEEDS_ADJUSTMENT} - Hoàn thành nhưng có sai lệch, chờ Manager điều
 * chỉnh</li>
 * <li>{@code ADJUSTED} - Đã được Manager điều chỉnh tồn kho</li>
 * </ul>
 */
public enum StocktakeStatus {
    DRAFT,
    IN_PROGRESS,
    COMPLETED,
    NEEDS_ADJUSTMENT,
    ADJUSTED
}
