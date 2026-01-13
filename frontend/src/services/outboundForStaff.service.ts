// import { SalesOrder } from "@/types/outbound";

import { OutboundDetailDTO,PickingTask } from "@/types/outboundDetails";
import api from "./api";
import { LocalPickingResult, OrderPickingSession } from "@/types/outbound.ts";
const STORAGE_PREFIX = "picking_results_";

export const outboundForStaffService = {

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