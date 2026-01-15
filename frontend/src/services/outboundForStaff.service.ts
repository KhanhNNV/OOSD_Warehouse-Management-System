// import { SalesOrder } from "@/types/outbound";

import { OutboundDetailDTO, PickingTask } from "@/types/outboundDetails";
import api from "./api";
import { LocalPickingResult, OrderPickingSession, RegisterResponse } from "@/types/outbound.ts";
const STORAGE_PREFIX = "picking_results_";

export const outboundForStaffService = {
// 1. MỞ COMMENT HÀM NÀY RA
  getOrderDetail: async (orderId: number): Promise<PickingTask[]> => {
    // Gọi API Java lấy dữ liệu
    const res = await api.get<OutboundDetailDTO[]>(
      `/api/outbound/${orderId}/details`
    );

    // Map dữ liệu từ Backend sang Frontend
const mappedData = res.data.map((item) => {
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        productSku: item.productSku,
        
        // Map đúng tên field mới sửa trong DTO
        requestedQty: item.requestedQty, 
        pickupQty: item.pickupQty,       // Backend bảo lấy bao nhiêu ở kệ này
        imageUrl: item.imageUrl,

        // Map vị trí gợi ý sang vị trí hiển thị cho user
        locationCode: item.recommendedLocationCode,
        locationId: item.recommendedLocationId,

        // Các field quản lý trạng thái local (FE tự điền)
        status: "PENDING",
        pickedQty: 0,
        note: "",
      } as PickingTask;
    });

    return mappedData;
  },

  verifyLocation: async (targetLocationId: number, scannedCode: string) => {
    try {
      const res = await api.post("/api/location/verify", {
        targetLocationId: targetLocationId,
        scannedLocationCode: scannedCode,
      });
      return res.data;
    } catch (error) {
      console.error("Verify Error:", error);
      return { isMatched: false, message: "Lỗi kết nối Server" };
    }
  },

  verifyProduct: async (targetProductId: number, scannedCode: string) => {
    try {
      const res = await api.post("/api/products/verify", {
        targetProductId,
        scannedProductCode: scannedCode,
      });
      return res.data;
    } catch (error) {
      return { isMatched: false, message: "Lỗi kết nối Server" };
    }
  },

  saveLocalResult: (orderId: number, result: LocalPickingResult) => {
    const key = `${STORAGE_PREFIX}${orderId}`;
    const currentSessionStr = localStorage.getItem(key);
    const session: OrderPickingSession = currentSessionStr
      ? JSON.parse(currentSessionStr)
      : {};

    // Cập nhật kết quả cho detailId này
    session[result.outboundDetailId] = result;

    localStorage.setItem(key, JSON.stringify(session));
  },

  // Lấy toàn bộ kết quả của đơn hàng
  getLocalResults: (orderId: number): OrderPickingSession => {
    const key = `${STORAGE_PREFIX}${orderId}`;
    const str = localStorage.getItem(key);
    return str ? JSON.parse(str) : {};
  },

  // Xóa session khi submit thành công
  clearLocalSession: (orderId: number) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${orderId}`);
  },

  submitBatchPicking: async (orderId: number, results: LocalPickingResult[]) => {

    const payload = results.map(({ timestamp, ...rest }) => rest);
    
    const res = await api.post(`/api/outbound/${orderId}/submit-batch`, payload);
    return res.data;
  },

  //- Staff nhận nhiệm vụ
  registerPicking: async (orderId: number): Promise<RegisterResponse> => {
    try {
      const response = await api.post<RegisterResponse>(
        `/api/outbound/${orderId}/register`
      );
      return response.data;
    } catch (error) {
      // Lấy message lỗi từ Backend (cái mà mình catch ở Controller ấy)
      const errorMessage =
        error.response?.data?.message || "Lỗi kết nối đến server";
      throw new Error(errorMessage);
    }
  },
};
