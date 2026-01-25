import api from "./api";
import { 
  ApiResponse,
  StocktakeSession, 
  StocktakeSessionDetail,
  CreateStocktakeRequest, 
  StocktakeAssignment,
  VarianceReportResponse,
  ApproveAdjustmentRequest,
  StocktakeBlindCountResponse,
  SubmitCountsRequest,
} from "../types/stocktake";
import { PageResponse } from "@/types/outboundordermanagement";

export const stocktakeService = {
  // =================================================================
  // NHÓM 1: QUẢN LÝ PHIÊN (MANAGER)
  // =================================================================

  // 1. Lấy danh sách tất cả phiên kiểm kê
  getAllSessions: async (page = 0, size = 5) => {
    const res = await api.get<ApiResponse<PageResponse<StocktakeSession>>>("/api/stocktake/sessions", {
        params: {
            page: page,
            size: size
        }
      });
    return res.data;
  },

  // 2. Lấy chi tiết 1 phiên
  getSessionDetail: async (id: number) => {
    const res = await api.get<ApiResponse<StocktakeSessionDetail>>(`/api/stocktake/sessions/${id}`);
    return res.data;
  },

  // 3. Tạo phiên mới (Zone)
  createSession: async (request: CreateStocktakeRequest) => {
    const res = await api.post<ApiResponse<StocktakeSession>>("/api/stocktake/sessions", request);
    return res.data;
  },

  // 4. Xóa phiên (Draft)
  deleteSession: async (id: number) => {
    const res = await api.delete<ApiResponse<void>>(`/api/stocktake/sessions/${id}`);
    return res.data;
  },

  // 5. Mở phiên (DRAFT -> IN_PROGRESS)
  openSession: async (id: number) => {
    const res = await api.post<ApiResponse<StocktakeSession>>(`/api/stocktake/sessions/${id}/open`);
    return res.data;
  },

  // 6. Đóng phiên (IN_PROGRESS -> COMPLETED)
  closeSession: async (id: number) => {
    const res = await api.post<ApiResponse<StocktakeSession>>(`/api/stocktake/sessions/${id}/close`);
    return res.data;
  },

  // =================================================================
  // NHÓM 2: BÁO CÁO & XỬ LÝ (MANAGER)
  // =================================================================

  // 10. Lấy báo cáo chênh lệch
  getVarianceReport: async (sessionId: number) => {
    const res = await api.get<ApiResponse<VarianceReportResponse>>(`/api/stocktake/sessions/${sessionId}/variance-report`);
    return res.data;
  },

  // 11. Duyệt & Điều chỉnh kho (Approve)
  approveAdjustment: async (request: ApproveAdjustmentRequest) => {
    const res = await api.post<ApiResponse<StocktakeSession>>("/api/stocktake/approve-adjustment", request);
    return res.data;
  },

  // 12. Yêu cầu kiểm lại (Recount)
  requestRecount: async (detailId: number, notes?: string) => {
    const res = await api.post<ApiResponse<void>>(`/api/stocktake/details/${detailId}/recount`, null, { 
      params: { notes } 
    });
    return res.data;
  },

  // =================================================================
  // NHÓM 3: THỰC HIỆN KIỂM ĐẾM (STAFF)
  // =================================================================

  // 13. Lấy danh sách việc (Assignments)
  getStaffAssignments: async () => {
    const res = await api.get<ApiResponse<StocktakeAssignment[]>>("/api/stocktake/assignments");
    return res.data;
  },

  // 14. Bắt đầu đếm 1 kệ (Start) -> Trả về list sản phẩm
  startAssignment: async (assignmentId: number) => {
    const res = await api.post<ApiResponse<StocktakeBlindCountResponse[]>>(`/api/stocktake/assignments/${assignmentId}/start`);
    return res.data;
  },

  // 15. Hoàn tất đếm kệ (Complete) -> Gửi kết quả
  completeAssignment: async (assignmentId: number, request: SubmitCountsRequest) => {
    const res = await api.post<ApiResponse<void>>(`/api/stocktake/assignments/${assignmentId}/complete`, request);
    return res.data;
  },
};
