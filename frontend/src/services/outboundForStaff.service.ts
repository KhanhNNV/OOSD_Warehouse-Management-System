// import { SalesOrder } from "@/types/outbound";

import { OutboundDetailDTO,PickingTask } from "@/types/outboundDetails";
import api from "./api";
import { SalesOrder } from "@/types/wms";
import { LocalPickingResult, OrderPickingSession } from "@/types/outboundForStaff.ts";
const STORAGE_PREFIX = "picking_results_";

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

export const outboundForStaffService = {
    getSOs: async (): Promise<SalesOrder[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(mockSOs), 500));
    },

getOrderDetail: async (orderId: number): Promise<PickingTask[]> => {
        // Gọi API Java lấy dữ liệu
        const res = await api.get<OutboundDetailDTO[]>(`/api/outbound/${orderId}/details`);

        // Map dữ liệu từ Backend (recommended...) sang Frontend (location...)
        const mappedData = res.data.map((item) => {
            return {
                id: item.id,
                productId: item.productId,
                productName: item.productName,
                productSku: item.productSku,
                requested_qty: item.requested_qty,

                // Map dữ liệu thật từ Backend
                locationCode: item.recommendedLocationCode, 
                locationId: item.recommendedLocationId,

                status: 'PENDING',
                pickedQty: 0,
                note: ''
            } as PickingTask;
        });
        
        return mappedData;
    },

    verifyLocation: async (targetLocationId: number, scannedCode: string) => {
        try {
            
            const res = await api.post("/api/location/verify", { 
                targetLocationId: targetLocationId,
                scannedLocationCode: scannedCode
            });
            return res.data; 
        } catch (error) {
            console.error("Verify Error:", error);
            return { isMatched: false, message: "Lỗi kết nối Server" };
        }
    },

    verifyProduct: async (targetProductId: number, scannedCode: string) => {
         try {
            const res = await api.post("/api/products/verify", {
                targetProductId,
                scannedProductCode: scannedCode
            })
            return res.data;
        } catch (error) {   
            return { isMatched: false, message: "Lỗi kết nối Server" };
        }
    },

    saveLocalResult: (orderId: number, result: LocalPickingResult) => {
        const key = `${STORAGE_PREFIX}${orderId}`;
        const currentSessionStr = localStorage.getItem(key);
        const session: OrderPickingSession = currentSessionStr ? JSON.parse(currentSessionStr) : {};
        
        // Cập nhật kết quả cho detailId này
        session[result.outboundDetailId] = result;
        
        localStorage.setItem(key, JSON.stringify(session));
    },

    // Lấy toàn bộ kết quả của đơn hàng
    getLocalResults: (orderId: number): OrderPickingSession => {
        const key = `${STORAGE_PREFIX}${orderId}`;
        const str = localStorage.getItem(key);
        return str ? JSON.parse(str) : {};
    },

    // Xóa session khi submit thành công
    clearLocalSession: (orderId: number) => {
        localStorage.removeItem(`${STORAGE_PREFIX}${orderId}`);
    },

    submitBatchPicking: async (orderId: number, results: LocalPickingResult[]) => {
        // Gửi lên server danh sách các item đã hoàn thành
        const res = await api.post(`/api/outbound/${orderId}/submit-batch`, results);
        return res.data;
    }
};