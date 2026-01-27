import api from "@/services/api";
import { InventoryDetail } from "@/types/inventoryManager";
import { ZoneResponse } from "@/types/wms";

export const inventoryManagerService = {
  // 1. Lấy danh sách Zone
  getZones: async () => {
    const res = await api.get<ZoneResponse[]>("/api/location/zones");
    return res.data;
  },

  // 2. Lấy thống kê Kệ (Số lượng để tô màu)
  getShelfStats: async (zoneCode: string) => {
    const res = await api.get<Record<string, number>>(`/api/location/zones/${zoneCode}/shelf-stats`);
    return res.data;
  },

  // 3. Lấy chi tiết hàng trong kệ
  getShelfInventory: async (zoneCode: string, shelfCode: string) => {
    const res = await api.get<InventoryDetail[]>(`/api/location/zones/${zoneCode}/shelves/${shelfCode}/inventory`);
    // Kiểm tra an toàn: Nếu data trả về là mảng thì lấy, không thì trả về mảng rỗng
    return Array.isArray(res.data) ? res.data : [];
  }
};

export const getProductImageUrl = (imagePath?: string) => {
  // 1. Nếu không có ảnh -> Trả về ảnh placeholder
  if (!imagePath || imagePath.trim() === "") {
      return "https://placehold.co/100x100?text=No+Image";
  }

  // 2. Nếu là Link Online (Google Storage, AWS S3, Imgur...)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath; // Trả về nguyên gốc
  }

  // 3. Nếu là file Local (do upload lên server mình)
  // Lưu ý: Thay localhost bằng domain thật nếu deploy
  const API_BASE_URL = "http://localhost:8080"; 
  return `${API_BASE_URL}/api/products/images/${imagePath}`;
};