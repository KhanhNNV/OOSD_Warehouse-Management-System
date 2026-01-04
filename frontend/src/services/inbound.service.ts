import api from './api';
import { PurchaseOrder } from '@/types/inbound';

const ENDPOINT = '/api/inbound/purchase-orders';

export const inboundService = {
    // 1. Lấy danh sách phiếu nhập
    getPOs: async (): Promise<PurchaseOrder[]> => {
        try {
            const response = await api.get<PurchaseOrder[]>(ENDPOINT);
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách PO:", error);
            throw error;
        }
    },

    // 2. Lấy chi tiết một phiếu nhập
    getPODetail: async (id: string | number): Promise<PurchaseOrder> => {
        const response = await api.get<PurchaseOrder>(`${ENDPOINT}/${id}`);
        return response.data;
    },

    // 3. Tạo phiếu nhập mới (nếu cần)
    createPO: async (data: any): Promise<PurchaseOrder> => {
        const response = await api.post<PurchaseOrder>(ENDPOINT, data);
        return response.data;
    },

    // 4. --- HÀM MỚI BỔ SUNG ĐỂ FIX LỖI ---
    approveInboundResult: async (poId: string | number): Promise<void> => {
        await api.put(`${ENDPOINT}/${poId}/approve`);
    },
    submitInbound: async (poId: string | number, items: any[]) => {
        // Gọi đúng API mà bạn đã test thành công trên Postman
        const response = await api.post(`${ENDPOINT}/${poId}/submit`, items);
        return response.data;
    }
};