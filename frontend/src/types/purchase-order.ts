export type POStatus =
    | 'NEW'        // Mới tạo
    | 'APPROVED'   // Sếp duyệt
    | 'RECEIVING'  // Xe đang xuống hàng
    | 'COMPLETED'  // Xong
    | 'CANCELLED'  // Hủy
    | 'DISCREPANCY'; // Thiếu/Dư

export interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}

export interface PoDetail {
    id: number;
    productId: number;
    productSku: string;
    productName: string;
    expectedQty: number; // Manager sẽ có field này
}

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplierName: string;
    status: POStatus;
    expectedDate?: string;
    createdBy: string;
    createdByName: string;
    totalItems: number;
    totalQuantity: number; // Field mới
    createdAt?: string;

    // Quan trọng: List details nằm ngay trong object cha
    details: PoDetail[];
}