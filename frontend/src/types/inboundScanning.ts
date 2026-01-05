//TYPE: dành cho scan sản phẩm

import { ProductScanResponse } from "./product";

// Interface mở rộng từ ProductScanResponse để thêm các trường phục vụ nhập kho
export interface ScannedItem extends ProductScanResponse {
    id: number;
    inputQty: number;       // Số lượng nhập thực tế
    reportReason?: string;  // Lý do báo cáo lỗi (nếu có)
    note?: string;          // Ghi chú thêm
}

// Các chế độ của Modal (Phiên làm việc)
export type SessionMode = 'ADD' | 'EDIT' | 'REPORT_ITEM' | 'REPORT_INVOICE' | null;

// Interface quản lý trạng thái phiên làm việc hiện tại
export interface WorkingSession {
    mode: SessionMode;
    item?: ScannedItem; 
    index?: number;     
}

// Interface cho trạng thái của hộp thoại xác nhận
export interface ConfirmState {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'danger' | 'info' | 'success';
    onConfirm: () => void;
}