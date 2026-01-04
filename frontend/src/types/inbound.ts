import { ProductScanResponse } from "./product";

// 3. Purchase Order Status (Quy trình mua hàng)
export type POStatus =
    | 'NEW'        // Mới tạo
    | 'APPROVED'   // Sếp duyệt
    | 'RECEIVING'  // Xe đang xuống hàng
    | 'COMPLETED'  // Xong
    | 'CANCELLED'; // Hủy

// Hiển thị thông tin tổng quát của PO    
export interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplierName: string;
    status: POStatus;
    expectedDate: string;

    assigneeId?: number;    
    assigneeName?: string;  

  
    totalItems?: number;     
    totalQuantity?: number;  
    
    receivedItems?: number; 
    hasVariance?: boolean;  
}
// Hiển thị danh sách sản phẩm của PO 
export interface PurchaseOrderDetail extends PurchaseOrder{
    items: ProductScanResponse[];
}

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

