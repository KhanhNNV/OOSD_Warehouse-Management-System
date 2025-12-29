import { SalesOrder } from "@/types/outbound";

const mockSOs: SalesOrder[] = [
    {
        id: "1", orderNumber: "SO-2024-001", customerName: "Công ty ABC",
        status: "NEW", // Mới đổ về
        createdAt: "2024-10-14T08:00:00Z", totalItems: 25, allocatedItems: 0,
    },
    {
        id: "2", orderNumber: "SO-2024-002", customerName: "Shop XYZ",
        status: "ALLOCATED", // Đã giữ chỗ trên kệ
        createdAt: "2024-10-14T09:00:00Z", totalItems: 15, allocatedItems: 15,
    },
    {
        id: "3", orderNumber: "SO-2024-003", customerName: "Cửa hàng 123",
        status: "PICKING", // Đang đi lấy
        createdAt: "2024-10-14T10:00:00Z", totalItems: 8, allocatedItems: 8,
    },
    {
        id: "4", orderNumber: "SO-2024-004", customerName: "Đại lý Miền Nam",
        status: "PACKED", // Đã đóng gói
        createdAt: "2024-10-13T14:00:00Z", totalItems: 50, allocatedItems: 50,
    },
    {
        id: "5", orderNumber: "SO-2024-005", customerName: "FPT Shop",
        status: "SHIPPED", // Đã giao
        createdAt: "2024-10-13T11:00:00Z", totalItems: 30, allocatedItems: 30,
    },
];

export const outboundService = {
    getSOs: async (): Promise<SalesOrder[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(mockSOs), 500));
    }
};