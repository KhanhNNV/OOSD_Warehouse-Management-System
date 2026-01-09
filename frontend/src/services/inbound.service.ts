import api from './api';
import { PurchaseOrder } from '@/types/poForStaff.ts';
import {InboundNoteResponse,InboundSubmitItem} from "@/types/inbound.ts";

const ENDPOINT = "/api/inbound";

export const inboundService = {


    // 4. --- HÀM MỚI BỔ SUNG ĐỂ FIX LỖI ---
    approveInboundResult: async (poId: string | number): Promise<void> => {
        await api.put(`${ENDPOINT}/${poId}/approve`);
    },
    submitInbound: async (poId: string | number, items: InboundSubmitItem[]) => {
        const response = await api.post<InboundNoteResponse>(`${ENDPOINT}/${poId}/submit`, items);
        return response.data; // Trả về InboundNoteResponse
    },
    cancelInbound: async (poId: string | number, reason: string): Promise<void> => {
        // Lưu ý: URL này phải khớp với Controller Backend bạn vừa test Postman
        // Backend: @PostMapping("/manager/cancel/{poId}") trong InboundController
        // Giả sử prefix controller là /api/inbound
        await api.post(`/api/inbound/manager/cancel/${poId}?reason=${encodeURIComponent(reason)}`);
    },


    getPOs: async (): Promise<PurchaseOrder[]> => {
        try {
            const response = await api.get<PurchaseOrder[]>("/api/purchase-order/staff");
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách PO:", error);
            throw error;
        }
    },

    createInboundNote: async (id: number | string) => {
        // Backend: @PostMapping("/{id}") -> /api/inbound/{id}
        const response = await api.post(`${ENDPOINT}/${id}`);
        return response.data;
    },

    getMyInboundNotes: async (): Promise<InboundNoteResponse[]> => {
        const url = '/api/inbound/my-notes';
        const response = await api.get<InboundNoteResponse[]>(`${ENDPOINT}/my-notes`);
        return response.data;
    },

};