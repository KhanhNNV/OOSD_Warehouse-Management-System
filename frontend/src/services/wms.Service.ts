import axios from 'axios';
import { ShelfCreateRequest, ZoneResponse, BarcodeResponse } from '../types/wms';

// Cấu hình base URL
const API_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Nếu không có đoạn này, request sẽ không gửi Token -> Backend trả về 401
api.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage (hoặc nơi bạn lưu trữ)
    const token = localStorage.getItem('accessToken'); 

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý lỗi trả về (Optional: Log hoặc redirect nếu 401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Phiên đăng nhập hết hạn hoặc không hợp lệ.");
      // Có thể thêm logic redirect về trang login tại đây nếu cần
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const locationService = {
  // Lấy tất cả mã vị trí
  getAllLocationCodes: async (): Promise<string[]> => {
    const response = await api.get<string[]>('/location/codes');
    return response.data;
  },

  // Lấy danh sách khu vực
  getZones: async (): Promise<ZoneResponse[]> => {
    const response = await api.get<ZoneResponse[]>('/location/zones');
    return response.data;
  },

  // Lấy danh sách kệ theo khu vực
  getShelvesByZone: async (zoneCode: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/location/zones/${zoneCode}/shelves`);
    return response.data;
  },

  // Tạo kệ mới
  createShelf: async (data: ShelfCreateRequest): Promise<void> => {
    await api.post('/location/shelves', data);
  },

    deleteLocation: async (code: string): Promise<void> => {
    await api.delete('/location', { params: { code } });
  },


  // Xóa kệ
  deleteShelf: async (zone: string, shelf: string): Promise<void> => {
    await api.delete('/location/shelves', {
      params: { zone, shelf }
    });
  },

  // Lấy trạng thái
  getLocationStatus: async (id: number): Promise<boolean> => {
    const response = await api.get<{ is_full: boolean }>(`/location/${id}/status`);
    return response.data.is_full;
  }
};

export const barcodeService = {
  // Tạo mã vạch
  generateBarcode: async (code: string): Promise<string> => {
    const response = await api.get<BarcodeResponse>('/barcode/generate', {
      params: { code }
    });
    return response.data.barcodeBase64;
  }
};