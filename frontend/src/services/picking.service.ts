// src/services/picking.service.ts
import api from "@/services/api"; // Import file api.ts cấu hình sẵn của bạn
import { InternalPickRequest, LocationResponse } from "@/types/picking";

export const pickingService = {
    // 1. Tìm vị trí (Xử lý êm lỗi 404)
    getLocationByCode: async (code: string): Promise<LocationResponse | null> => {
        try {
            const res = await api.get(`/api/location/code/${code}`);
            // Xử lý response bọc trong data hoặc trả trực tiếp
            const data = res.data?.data || res.data;

            if (data && data.id) return data;
            return null;
        } catch (e: any) {
            // NẾU API TRẢ VỀ 404 -> Trả về null để code chạy tiếp sang tìm sản phẩm
            if (e.response && e.response.status === 404) {
                return null;
            }
            console.error("Lỗi API Location:", e);
            return null;
        }
    },

    // 2. Tìm sản phẩm
    getProductByBarcode: async (barcode: string): Promise<any | null> => {
        try {
            const res = await api.get(`/api/products/barcode/${barcode}`);
            const data = res.data?.data || res.data;

            if (data && (data.id || data.productId)) {
                return {
                    ...data,
                    productId: data.productId || data.id // Chuẩn hóa ID
                };
            }
            return null;
        } catch (e) {
            console.error("Lỗi tìm sản phẩm:", e);
            return null;
        }
    },

    // 3. Gửi lệnh Pick (Gọi API Java của bạn)
    submitPick: async (payload: InternalPickRequest[]) => {
        return await api.post('/api/inventory-movements/pick', payload);
    },

    getStageLocations: async (): Promise<LocationResponse[]> => {
        try {
            // Giả sử API backend của bạn hỗ trợ filter theo type
            // URL có thể là: /api/locations?type=STAGE_LOC hoặc endpoint riêng
            const res = await api.get('/api/location/type/STAGE_LOC');
            return res.data?.data || res.data || [];
        } catch (e) {
            console.error("Lỗi lấy danh sách Stage:", e);
            return [];
        }
    },


};