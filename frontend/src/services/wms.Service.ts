// import axios from 'axios';
import { ShelfCreateRequest, ZoneResponse, BarcodeResponse } from '../types/wms';
import api from './api'

export const locationService = {
  // Lấy tất cả mã vị trí
  getAllLocationCodes: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/api/location/codes');
    return response.data;
  },

  // Lấy danh sách khu vực
  getZones: async (): Promise<ZoneResponse[]> => {
    const response = await api.get<ZoneResponse[]>('/api/location/zones');
    return response.data;
  },

  // Lấy danh sách kệ theo khu vực
  getShelvesByZone: async (zoneCode: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/api/location/zones/${zoneCode}/shelves`);
    return response.data;
  },

  // Tạo kệ mới
  createShelf: async (data: ShelfCreateRequest): Promise<void> => {
    await api.post('/api/location/shelves', data);
  },

    deleteLocation: async (code: string): Promise<void> => {
    await api.delete('/api/location', { params: { code } });
  },


  // Xóa kệ
  deleteShelf: async (zone: string, shelf: string): Promise<void> => {
    await api.delete('/api/location/shelves', {
      params: { zone, shelf }
    });
  },

  // Lấy trạng thái
  getLocationStatus: async (id: number): Promise<boolean> => {
    const response = await api.get<{ is_full: boolean }>(`/api/location/${id}/status`);
    return response.data.is_full;
  }
};

export const barcodeService = {
  // Tạo mã vạch
  generateBarcode: async (code: string): Promise<string> => {
    const response = await api.get<BarcodeResponse>('/api/barcode/generate', {
      params: { code }
    });
    return response.data.barcodeBase64;
  }
};