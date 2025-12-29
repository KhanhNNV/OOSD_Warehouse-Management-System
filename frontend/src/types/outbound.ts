// 5. Outbound Order Status (Quy trình xuất hàng)
export type SOStatus =
    | 'NEW'        // Mới từ kinh doanh đổ về
    | 'ALLOCATED'  // Hệ thống đã "xí phần" hàng trên kệ
    | 'PICKING'    // Nhân viên đang đi nhặt
    | 'PACKED'     // Đóng thùng xong
    | 'SHIPPED';   // Giao cho shipper

export interface SalesOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    status: SOStatus;
    createdAt: string;
    totalItems: number;
    allocatedItems: number; // Số lượng đã giữ chỗ thành công
}

export interface OutboundStats {
    new: number;
    processing: number; // Gom nhóm Allocated + Picking + Packed
    shipped: number;
}