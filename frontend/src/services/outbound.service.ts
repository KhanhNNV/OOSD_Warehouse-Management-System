// import { SalesOrder } from "@/types/outbound";

// const mockSOs: SalesOrder[] = [
//     {
//         id: "1", orderNumber: "SO-2024-001", customerName: "Công ty ABC",
//         status: "NEW", // Mới đổ về
//         createdAt: "2024-10-14T08:00:00Z", totalItems: 25, allocatedItems: 0,
//     },
//     {
//         id: "2", orderNumber: "SO-2024-002", customerName: "Shop XYZ",
//         status: "ALLOCATED", // Đã giữ chỗ trên kệ
//         createdAt: "2024-10-14T09:00:00Z", totalItems: 15, allocatedItems: 15,
//     },
//     {
//         id: "3", orderNumber: "SO-2024-003", customerName: "Cửa hàng 123",
//         status: "PICKING", // Đang đi lấy
//         createdAt: "2024-10-14T10:00:00Z", totalItems: 8, allocatedItems: 8,
//     },
//     {
//         id: "4", orderNumber: "SO-2024-004", customerName: "Đại lý Miền Nam",
//         status: "PACKED", // Đã đóng gói
//         createdAt: "2024-10-13T14:00:00Z", totalItems: 50, allocatedItems: 50,
//     },
//     {
//         id: "5", orderNumber: "SO-2024-005", customerName: "FPT Shop",
//         status: "SHIPPED", // Đã giao
//         createdAt: "2024-10-13T11:00:00Z", totalItems: 30, allocatedItems: 30,
//     },
// ];

// export const outboundService = {
//     getSOs: async (): Promise<SalesOrder[]> => {
//         return new Promise((resolve) => setTimeout(() => resolve(mockSOs), 500));
//     }
// };

import api from "./api";
import {
  OutboundOrder,
  CreateOutboundRequest,
  PickingInstruction,
  ConfirmPickingRequest,
  OutboundNote,
  SystemConfig,
  UpdateAlgorithmRequest
} from "@/types/outbound";

// ============================================
// SYSTEM CONFIG SERVICE (ADMIN)
// ============================================
export const systemConfigService = {
  /**
   * Lấy cấu hình hiện tại
   */
  getCurrentConfig: async (): Promise<SystemConfig> => {
    const response = await api.get("/api/system-config");
    return response.data.data;
  },

  /**
   * Cập nhật thuật toán xuất kho (Admin only)
   */
  updateAlgorithm: async (request: UpdateAlgorithmRequest): Promise<SystemConfig> => {
    const response = await api.put("/api/system-config/algorithm", request);
    return response.data.data;
  }
};

// ============================================
// OUTBOUND SERVICE
// ============================================
export const outboundService = {
  /**
   * 1. Tạo đơn hàng xuất mới (Manager)
   */
  createOrder: async (request: CreateOutboundRequest): Promise<OutboundOrder> => {
    const response = await api.post("/api/outbound/orders", request);
    return response.data.data;
  },

  /**
   * 2. Lấy danh sách đơn chờ xuất
   */
  getPendingOrders: async (): Promise<OutboundOrder[]> => {
    const response = await api.get("/api/outbound/orders/pending");
    return response.data.data;
  },

  /**
   * 3. Lấy tất cả đơn hàng
   */
  getAllOrders: async (): Promise<OutboundOrder[]> => {
    const response = await api.get("/api/outbound/orders");
    return response.data.data;
  },

  /**
   * 4. Lấy chi tiết đơn hàng
   */
  getOrderById: async (id: number): Promise<OutboundOrder> => {
    const response = await api.get(`/api/outbound/orders/${id}`);
    return response.data.data;
  },

  /**
   * 5. Lấy chỉ dẫn kệ hàng (Picking Instruction)
   */
  getPickingInstruction: async (orderId: number): Promise<PickingInstruction> => {
    const response = await api.get(`/api/outbound/orders/${orderId}/picking-instruction`);
    return response.data.data;
  },

  /**
   * 6. Xác nhận xuất kho
   */
  confirmPicking: async (request: ConfirmPickingRequest): Promise<OutboundNote> => {
    const response = await api.post("/api/outbound/confirm-picking", request);
    return response.data.data;
  },

  /**
   * 7. Hủy đơn hàng
   */
  cancelOrder: async (orderId: number): Promise<void> => {
    await api.delete(`/api/outbound/orders/${orderId}`);
  }
};