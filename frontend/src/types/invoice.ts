// src/types/invoice.ts

export type InvoiceStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

// 2. Interface Hóa đơn
export interface Invoice {
    id: number;
    invoiceNumber: string;
    totalAmount: number;
    taxAmount: number;
    finalAmount: number;
    status: InvoiceStatus; // Sử dụng type vừa định nghĩa ở trên

    customer: {
        id: number;
        name: string;
        email: string;
        phone?: string;
        address?: string;
    };

    staff: {
        id: number;
        fullName: string;
    };

    createdAt: string;
}

// 3. Request tạo hóa đơn
export interface InvoiceCreateRequest {
    outboundOrderId: number;
    note?: string;
}