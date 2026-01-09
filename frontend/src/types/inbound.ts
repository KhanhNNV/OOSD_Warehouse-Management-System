// Định nghĩa Status để dễ quản lý màu sắc và logic
export type InboundStatus = 'DRAFT' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

export interface InboundSubmitItem {
    productId: number; // ID sản phẩm (Long)
    actualQty: number; // Số lượng thực tế đếm được (QUAN TRỌNG: Không phải expectedQty)
}

// Chi tiết sản phẩm trong phiếu (nếu cần hiển thị detail)
export interface InboundDetailDto {
    id: number;
    productId: number;
    productName?: string;
    actualQty: number;
    note: string;
}

// Interface chính khớp với InboundNoteResponse bên Java
export interface InboundNoteResponse {
    id: number;
    poNumber: string
    noteNumber: string;       // vd: "INB-123456"
    purchaseOrderId: number;  // ID của PO gốc
    status: InboundStatus;    // Trạng thái phiếu
    receivedDate: string;     // LocalDateTime ISO string
    processedBy: string;
    inboundDetails: InboundDetailDto[]; // Danh sách hàng đã nhập
}

export interface InboundResultDetail {
    productId: string; // Backend trả về String.valueOf(id)
    isValid: boolean;
    message?: string;   // vd: "Sai số lượng!", "Sản phẩm không có trong PO"
}

export interface InboundErrorResponse {
    status: string;    // "error"
    message: string;   // "Dữ liệu nhập kho không khớp với PO"
    details: InboundResultDetail[]; // <--- Danh sách này dùng để tô đỏ Modal
}

export interface ProductScanResponse {
    productId: number; // Lưu ý thống nhất tên (id hay productId)
    sku: string;
    barcode: string;
    productName: string;
    image: string;     // BE trả về imageUrl hay image?
    categoryName?: string;
    unit?: string;
}

// Interface dùng cho State ở Frontend (để hiển thị trên màn hình Scan)
export interface ScannedItem extends ProductScanResponse {
    inputQty: number;      // Số lượng staff đang nhập trên máy
    reportReason?: string; // Lý do lỗi (nếu có)
    note?: string;         // Ghi chú thêm
}


export type ScanData = Record<string, number>;

