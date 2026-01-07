// 3. Purchase Order Status (Quy trình mua hàng)
export type POStatus =
    | 'NEW'        // Mới tạo
    | 'APPROVED'   // Sếp duyệt
    | 'RECEIVING'  // Xe đang xuống hàng
    | 'COMPLETED'  // Xong
    | 'CANCELLED'  // Hủy
    | 'DISCREPANCY'; // Thiếu/Dư




// Hiển thị thông tin tổng quát của PO
export interface PurchaseOrder {
    id: string;
    poNumber: string;
    supplierName: string;
    status: POStatus;
    createdAt: string;
    expectedDate: string;
    totalItems: number;
    createdByName?: string;  
    assigneeName?: string;
    //Có thể bỏ nhỉ
    receivedItems: number; // Đã nhận thực tế
    hasVariance: boolean;  // Cờ báo lệch so với PO
    retryCount?: number; // Thêm dòng này (dấu ? để không bắt buộc nếu backend chưa trả về)
}
// Hiển thị danh sách sản phẩm của
export interface PurchaseOrderDetail{
    items: InboundProduct[];
}
export interface PoProductDetail {
    productId: number;
    productName: string;
    productSku: string; 
}
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

