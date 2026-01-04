import api from './api'; 
import { PurchaseOrder,InboundSubmitRequest, InboundSubmitResponse} from '@/types/inbound';


const PO_ENDPOINT = '/api/inbound/po';

export const inboundService = {
    // 1. Lấy danh sách phiếu nhập (có thể thêm params phân trang/lọc sau này)
    getPOs: async (): Promise<PurchaseOrder[]> => {
        const response = await api.get<PurchaseOrder[]>(PO_ENDPOINT); 
        return response.data;
    },

    // 2. Lấy chi tiết một phiếu nhập (Ví dụ bổ sung)
    getPODetail: async (id: number): Promise<PurchaseOrder> => {
        const response = await api.get<PurchaseOrder>(`${PO_ENDPOINT}/${id}`);
        return response.data;
    },

};