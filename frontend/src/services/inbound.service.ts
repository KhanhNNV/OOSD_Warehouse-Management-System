import { PurchaseOrder } from "@/types/inbound";

const mockPOs: PurchaseOrder[] = [
    {
        id: "1", poNumber: "PO-2024-001", supplierName: "Samsung Vietnam",
        status: "NEW", // Mới tạo
        createdAt: "2024-10-14T08:00:00Z", expectedDate: "2024-10-16T08:00:00Z",
        totalItems: 50, receivedItems: 0, hasVariance: false,
    },
    {
        id: "2", poNumber: "PO-2024-002", supplierName: "Apple Vietnam",
        status: "RECEIVING", // Đang dỡ hàng
        createdAt: "2024-10-13T10:00:00Z", expectedDate: "2024-10-15T08:00:00Z",
        totalItems: 100, receivedItems: 45, hasVariance: true,
    },
    {
        id: "3", poNumber: "PO-2024-003", supplierName: "Dell Technologies",
        status: "APPROVED", // Đã duyệt, chờ xe tới
        createdAt: "2024-10-12T14:00:00Z", expectedDate: "2024-10-14T08:00:00Z",
        totalItems: 30, receivedItems: 0, hasVariance: false,
    },
    {
        id: "4", poNumber: "PO-2024-004", supplierName: "LG Electronics",
        status: "COMPLETED", // Xong
        createdAt: "2024-10-10T09:00:00Z", expectedDate: "2024-10-12T08:00:00Z",
        totalItems: 75, receivedItems: 75, hasVariance: false,
    },
];

export const inboundService = {
    getPOs: async (): Promise<PurchaseOrder[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(mockPOs), 500));
    }
};