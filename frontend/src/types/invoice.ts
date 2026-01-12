// // src/types/invoice.ts
//
// export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';
// export interface InvoiceDetail {
//     id: number;
//     product: {
//         id: number;
//         name: string;
//         sku: string;
//         image?: string;
//     };
//     quantity: number;
//     unitPrice: number;
//     totalLineAmount: number;
// }
// // 2. Interface Hóa đơn
// export interface Invoice {
//     id: number;
//     invoiceNumber: string;
//     totalAmount: number;
//     taxAmount: number;
//     finalAmount: number;
//     status: InvoiceStatus; // Sử dụng type vừa định nghĩa ở trên
//
//     customer: {
//         id: number;
//         name: string;
//         email: string;
//         phone?: string;
//         address?: string;
//     };
//
//     createdBy?: {
//         id: number;
//         fullName: string;
//         username?: string;
//     };
//
//     details?: InvoiceDetail[];
//
//     createdAt: string;
// }
//
// // 3. Request tạo hóa đơn
// export interface InvoiceCreateRequest {
//     outboundOrderId: number;
//     note?: string;
// }

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

// 1. Định nghĩa các type con để dùng cho OutboundNote
export interface OutboundOrder {
    id: number;
    orderNumber: string; // Cần cái này để in lên phiếu (Số phiếu: ...)
    status?: string;
}

export interface OutboundNote {
    id: number;
    code: string;
    outboundOrder?: OutboundOrder; // Quan trọng: Để lấy được orderNumber
    exportedDate?: string;
}

// 2. Chi tiết hóa đơn
export interface InvoiceDetail {
    id: number;
    product: {
        id: number;
        name: string;
        sku: string;
        image?: string;
        unit?: string; // <-- Thêm cái này để hiển thị ĐVT trên bảng in
    };
    quantity: number;
    unitPrice: number;
    totalLineAmount: number;
}

// 3. Interface Hóa đơn chính
export interface Invoice {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    taxAmount: number;
    finalAmount: number;
    status: InvoiceStatus;

    // Thông tin khách hàng
    customer: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        address?: string;
    };

    // Người tạo
    createdBy?: {
        id: number;
        fullName: string;
        username?: string;
    };

    // --- CÁI BẠN ĐANG THIẾU ---
    outboundNote?: OutboundNote;
    // ---------------------------

    details?: InvoiceDetail[];

    createdAt: string;
    dueDate?: string; // Thêm hạn thanh toán (nếu backend có trả về)
}

// 4. Request tạo hóa đơn
export interface InvoiceCreateRequest {
    outboundOrderId: number;
    note?: string;
}