import api from "./api";
import { SkuZoneConfig, SkuZoneConfigRequest } from "../types/skuZoneConfig";

const ENDPOINT = "/api/sku-zone-configs";

export const skuZoneConfigService = {
  getAll: async (): Promise<SkuZoneConfig[]> => {
    const response = await api.get(ENDPOINT);
    return response.data;
  },

  getById: async (id: number): Promise<SkuZoneConfig> => {
    const response = await api.get(`${ENDPOINT}/${id}`);
    return response.data;
  },

  create: async (data: SkuZoneConfigRequest): Promise<SkuZoneConfig> => {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  },

  update: async (id: number, data: SkuZoneConfigRequest): Promise<SkuZoneConfig> => {
    const response = await api.put(`${ENDPOINT}/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${ENDPOINT}/${id}`);
  },
};