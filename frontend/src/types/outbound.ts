// // 5. Outbound Order Status (Quy trình xuất hàng)
// export type SOStatus =
//     | 'NEW'        // Mới từ kinh doanh đổ về
//     | 'ALLOCATED'  // Hệ thống đã "xí phần" hàng trên kệ
//     | 'PICKING'    // Nhân viên đang đi nhặt
//     | 'PACKED'     // Đóng thùng xong
//     | 'SHIPPED';   // Giao cho shipper
//
// export interface SalesOrder {
//     id: string;
//     orderNumber: string;
//     customerName: string;
//     status: SOStatus;
//     createdAt: string;
//     totalItems: number;
//     allocatedItems: number; // Số lượng đã giữ chỗ thành công
// }
//
// export interface OutboundStats {
//     new: number;
//     processing: number; // Gom nhóm Allocated + Picking + Packed
//     shipped: number;
// }

// src/types/outbound.ts

// 1. Cập nhật lại Type cho khớp 100% với Enum Java OrderStatus
export type OutboundStatus =
    | 'NEW'        // Mới tạo
    | 'ALLOCATED'  // Đã phân bổ
    | 'PICKING'    // Đang lấy hàng
    | 'PACKED'     // Đóng gói xong (Điều kiện để xuất hóa đơn)
    | 'SHIPPED';   // Đã giao đi

// 2. Interface chính khớp với JSON từ Backend
export interface OutboundOrder {
    id: number;
    orderNumber: string;
    status: OutboundStatus; // Dùng type ở trên để gợi ý code cho chuẩn
    createdDate: string;

    // Object Customer từ Backend trả về
    customer?: {
        id: number;
        name: string;
        phone?: string;
        address?: string;
        email?: string;
    };

    // Thông tin người nhận
    toName?: string;
    toPhone?: string;
    toAddress?: string;

    // Thông tin người tạo
    createdBy?: {
        id: number;
        fullName: string;
        username: string;
    };
}