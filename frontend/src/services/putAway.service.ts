// src/services/putaway.service.ts
import api from "@/services/api";
import { PutAwayRequest } from "@/types/putAway";
import { pickingService } from "@/services/picking.service";

export const putawayService = {
    // Tận dụng lại hàm tìm kiếm của Picking
    getProductByBarcode: pickingService.getProductByBarcode,
    getLocationByCode: pickingService.getLocationByCode,

    // API Cất hàng
    submitPutAway: async (payload: PutAwayRequest) => {
        return await api.post('/api/inventory-movements/put-away', payload);
    }
};