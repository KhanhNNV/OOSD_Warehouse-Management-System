import api from "./api";
import {
  PurchaseOrder,
  InboundSubmitRequest,
  InboundSubmitResponse,
} from "@/types/inbound";

// Định nghĩa Endpoint (bạn thay đổi cho khớp với Controller Backend)
const ENDPOINT = "/purchase-orders";
const SUPPLIERS_ENDPOINT = "/suppliers";

export interface Supplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export const inboundService = {
  // 1. Lấy danh sách phiếu nhập (có thể thêm params phân trang/lọc sau này)
  getPOs: async (): Promise<PurchaseOrder[]> => {
    try {
      // Gọi GET /purchase-orders
      // api.get sẽ tự động kẹp Token vào header nhờ interceptor
      const response = await api.get<PurchaseOrder[]>(ENDPOINT);

      // Trả về dữ liệu từ backend
      return response.data;
    } catch (error) {
      console.error("Lỗi khi lấy danh sách PO:", error);
      throw error; // Ném lỗi ra để Component xử lý (hiện thông báo)
    }
  },

  // 1.5. Lấy danh sách Nhà cung cấp
  getSuppliers: async (): Promise<Supplier[]> => {
    try {
      const response = await api.get<Supplier[]>(SUPPLIERS_ENDPOINT);
      // Nếu BE trả về { data: [...] }, sửa lại:
      return Array.isArray(response.data)
        ? response.data
        : response.data?.data ?? [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách NCC:", error);
      throw error;
    }
  },

  // 2. Lấy chi tiết một phiếu nhập (Ví dụ bổ sung)
  getPODetail: async (id: string): Promise<PurchaseOrder> => {
    const response = await api.get<PurchaseOrder>(`${ENDPOINT}/${id}`);
    return response.data;
  },

  // 3. Tạo phiếu nhập mới (Ví dụ bổ sung)
  createPO: async (data): Promise<PurchaseOrder> => {
    const response = await api.post<PurchaseOrder>(ENDPOINT, data);
    return response.data;
  },
};
