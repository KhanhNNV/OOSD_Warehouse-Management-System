// Định nghĩa Status để dễ quản lý màu sắc và logic
export type InboundStatus = 'DRAFT' | 'VERIFIED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';

// Chi tiết sản phẩm trong phiếu (nếu cần hiển thị detail)
export interface InboundDetailDto {
    id: number;
    productId: number;
    actualQty: number;
    note: string;
}

// Interface chính khớp với InboundNoteResponse bên Java
export interface InboundNoteResponse {
    id: number;
    noteNumber: string;       // vd: "IBN-..."
    purchaseOrderId: number;
    poNumber: string;         // Mã đơn mua hàng
    processedBy: string;      // Username người xử lý
    status: InboundStatus;
    receivedDate: string;     // Java LocalDateTime trả về String ISO
    retryCount: number;
    inboundDetails: InboundDetailDto[];
}

// ===============================================================================================
export interface InboundProduct {    
    productId: string;
    sku: string;
    productName: string;
    imageProduct:string;
    barcode:string;
    unit:string;
    expectedQty?: number;
 // Có thể null(Staff) hoặc not null(Admin)
}
export interface ProductScanResponse {
    id: number;
    sku: string;
    barcode: string;
    name: string;
    imageUrl: string; 
    categoryName?: string;
    price?: number;
    // Thêm các trường khác nếu BE trả về thêm
}
// List dữ liệu gửi lên để kiểm tra SỐ LƯỢNG hàng do staff nhập 
export interface InboundSubmitRequest{
    poId:string;
    items:{
        productId:string;
        expectedQty:number;
    }[];
}
export interface InboundResultDetail{
    producteId: string;
    message?:string;
    isValid:boolean;
}
export interface InboundSubmitResponse{
    success:boolean;
    isLock:boolean;// Gửi sai 5 lần sẽ bị khóa
    results: InboundResultDetail[];
}



export type ScanData = Record<string, number>;

