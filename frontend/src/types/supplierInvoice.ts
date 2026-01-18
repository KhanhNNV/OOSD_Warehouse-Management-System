export interface SupplierInvoiceCreateRequest {
    inboundNoteId: number;
    invoiceNumber: string;
    dueDate?: string;
}

// Thêm interface cho chi tiết từng dòng sản phẩm
export interface SupplierInvoiceDetailResponse {
    id: number;
    productId: number;
    productSku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalLineAmount: number;
}

// Cập nhật interface chính đầy đủ
export interface SupplierInvoiceResponse {
    id: number;
    invoiceNumber: string;
    inboundNoteCode: string;
    supplierName: string;      // Mới thêm
    totalAmount: number;       // Mới thêm (Tổng tiền hàng)
    taxAmount: number;         // Mới thêm (Thuế)
    finalAmount: number;
    status: string;
    createdAt: string;
    dueDate: string;           // Mới thêm
    createdByName: string;     // Mới thêm
    details: SupplierInvoiceDetailResponse[]; // Mới thêm (Quan trọng nhất để hiện Modal)
}