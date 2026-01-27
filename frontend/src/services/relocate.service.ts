import api from "@/services/api";
import { RelocateRequest } from "@/types/relocate.ts";

export const inventoryService = {
    relocateItem: async (data: RelocateRequest) => {
        return await api.post<string>("/api/inventory-movements/relocate", data);
    }
};