import api from "@/services/api";
import { Product, ZoneResponse } from "@/types/wms";

// 1. Định nghĩa và EXPORT các Interface (Để InventoryPage import được)
export interface InventoryDetail {
  id: number;
  quantity: number;
  expiryDate: string | null;
  product: Product; 
  location: {
    id: number;
    code: string; 
    type: string;
  };
}

export interface ShelfStat {
  code: string;
  quantity: number;
  // Thêm thuộc tính color để khớp với logic bên Frontend
  color?: "red" | "yellow" | "green" | "gray"; 
}

// 2. Service chính
export const inventoryManagerService = {
  // Lấy danh sách Zone
  getZones: async () => {
    const res = await api.get<ZoneResponse[]>("/api/location/zones");
    return res.data;
  },

  // Lấy thống kê số lượng từng kệ trong Zone (để tô màu)
  getShelfStats: async (zoneCode: string) => {
    const res = await api.get<Record<string, number>>(`/api/location/zones/${zoneCode}/shelf-stats`);
    return res.data;
  },

  // Lấy chi tiết hàng trong 1 kệ (hoặc khu vực STAGE)
  getShelfInventory: async (zoneCode: string, shelfCode: string) => {
    const res = await api.get<InventoryDetail[]>(`/api/location/zones/${zoneCode}/shelves/${shelfCode}/inventory`);
    // Kiểm tra an toàn: Nếu data trả về là mảng thì lấy, không thì trả về mảng rỗng
    return Array.isArray(res.data) ? res.data : [];
  }
};

// 3. Hàm helper lấy ảnh sản phẩm
export const getProductImageUrl = (imagePath?: string) => {
  // Nếu không có ảnh -> Trả về ảnh placeholder
  if (!imagePath || imagePath.trim() === "") {
      return "https://placehold.co/100x100?text=No+Image";
  }

  // Nếu là Link Online (Google Storage, AWS S3...)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      return imagePath; // Trả về nguyên gốc
  }

  // Nếu là file Local (do upload lên server mình)
  // Lưu ý: Port 8080 là của Backend Spring Boot
  const API_BASE_URL = "http://localhost:8080"; 
  return `${API_BASE_URL}/api/products/images/${imagePath}`;
};