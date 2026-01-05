// src/services/putAway.service.ts
import api from "./api"; // Axios instance của bạn
import { LocationResponse } from "@/types/putAway.ts";

export const putAwayService = {
    getLocationByCode: async (code: string) => {
        // API backend bạn vừa thêm ở bước 1
        const response = await api.get<LocationResponse>(`/api/locations/code/${code}`);
        return response.data;
    },

    // API gọi Put Away (Gửi 1 item hoặc 1 list tùy BE)
    submitPutAway: async (payload: any) => {
        return await api.post('/api/inventory-movements/put-away', payload);
    }
};