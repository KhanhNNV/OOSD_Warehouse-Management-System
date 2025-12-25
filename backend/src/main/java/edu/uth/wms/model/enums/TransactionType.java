package edu.uth.wms.model.enums;

public enum TransactionType {
    INBOUND, // Nhập kho (Purchase Order)
    OUTBOUND, // Xuất kho (Sales Order)
    ADJUSTMENT, // Điều chỉnh kho (Stocktake/Variance)
    MOVE // Chuyển vị trí (Put-away: Stage -> Shelf)
}