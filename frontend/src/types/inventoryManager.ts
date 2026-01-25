import { Product } from "./wms";

// Định nghĩa cấu trúc dữ liệu cho Inventory nhận từ BE
export interface InventoryDetail {
  id: number;
  quantity: number;
  expiryDate: string | null;
  product: Product; // Sử dụng lại type Product có sẵn (có imageUrl)
  location: {
    id: number;
    code: string; // VD: A-01-01
    type: string;
  };
}

export interface ShelfStat {
  code: string;     // Mã kệ: 01, 02
  quantity: number; // Tổng số lượng
  color: "red" | "yellow" | "green" | "gray"; // Màu hiển thị
}