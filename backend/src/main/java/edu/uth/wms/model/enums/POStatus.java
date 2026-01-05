package edu.uth.wms.model.enums;

public enum POStatus 
{
    NEW, 
    APPROVED,
    RECEIVING,
    COMPLETED,
    CANCELLED,
    DISCREPANCY // <--- Status mới: Dành cho đơn bị lệch (Thiếu/Thừa)
}