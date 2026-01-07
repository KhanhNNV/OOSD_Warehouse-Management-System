import api from './api';
import { PoProductDetail, PurchaseOrder } from '@/types/inbound';

const ENDPOINT = '/api/inbound';

export const inboundService = {


    // 4. --- HÀM MỚI BỔ SUNG ĐỂ FIX LỖI ---
    approveInboundResult: async (poId: string | number): Promise<void> => {
        await api.put(`${ENDPOINT}/${poId}/approve`);
    },
    submitInbound: async (poId: string | number, items: any[]) => {
        // Gọi đúng API mà bạn đã test thành công trên Postman
        const response = await api.post(`${ENDPOINT}/${poId}/submit`, items);
        return response.data;
    },
    cancelInbound: async (poId: string | number, reason: string): Promise<void> => {
        // Lưu ý: URL này phải khớp với Controller Backend bạn vừa test Postman
        // Backend: @PostMapping("/manager/cancel/{poId}") trong InboundController
        // Giả sử prefix controller là /api/inbound
        await api.post(`/api/inbound/manager/cancel/${poId}?reason=${encodeURIComponent(reason)}`);
    },


    getPoProductsforStaff: async (id: string | number): Promise<PoProductDetail[]> => {
        // Gọi vào endpoint mới /products
        const response = await api.get<PoProductDetail[]>(`${ENDPOINT}/details/${id}`);
        return response.data;
    }
};