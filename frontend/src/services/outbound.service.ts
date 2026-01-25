import api from "./api";
import {
    OutboundOrder,
    CreateOutboundRequest,
    PickingInstruction,
    ConfirmPickingRequest,
    OutboundNote,
    SystemConfig,
    UpdateAlgorithmRequest, ScanPickRequest, ScanPickResponse
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
  },
    scanPickItem: async (payload: ScanPickRequest): Promise<ScanPickResponse> => {
        const response = await api.post<any>("/api/outbound/scan-pick", payload);
        return response.data.data;
    },
    registerPicking: async (orderId: number) => {
        return await api.post(`/api/outbound/${orderId}/register`);
    },
    finishPicking: async (orderId: number): Promise<void> => {
        await api.post(`/api/outbound/${orderId}/finish`);
    }
};