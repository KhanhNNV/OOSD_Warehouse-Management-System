// 3. Purchase Order Status (Quy trình mua hàng)
export type POStatus =
    | 'NEW'        // Mới tạo
    | 'APPROVED'   // Sếp duyệt
    | 'RECEIVING'  // Xe đang xuống hàng
    | 'COMPLETED'  // Xong
    | 'CANCELLED'; // Hủy

export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierName: string;
    status: POStatus;
    createdAt: string;
    expectedDate: string;
    totalItems: number;
    receivedItems: number; // Đã nhận thực tế
    hasVariance: boolean;  // Cờ báo lệch so với PO
}