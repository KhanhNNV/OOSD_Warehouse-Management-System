// ================= COMMON =================
// Định nghĩa luôn ApiResponse ở đây để không phải import lung tung
export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}
interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page
}
export type StocktakeStatus =
  | "DRAFT"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "NEEDS_ADJUSTMENT"
  | "ADJUSTED";
export type AssignmentStatus = "DRAFT" | "OPEN" | "IN_PROGRESS" | "COMPLETED";

// ================= SESSION RESPONSE =================
// Khớp với StocktakeSessionResponse.java
export interface StocktakeSession {
  id: number;
  code: string;
  status: StocktakeStatus;
  zoneCode: string;
  totalItems: number;
  countedItems: number;
  varianceCount: number;
  startedAt?: string;
  completedAt?: string;
  createdBy?: string;
}

// Khớp với StocktakeDetailResponse.java
export interface StocktakeDetail {
  id: number;
  productId: number;
  productSku: string;
  productName: string;
  productImage?: string;
  productBarcode?: string;
  productUnit?: string;
  locationId: number;
  locationCode: string;
  systemQtySnapshot: number;
  actualCountedQty?: number;
  variance?: number;
}

// Khớp với StocktakeSessionDetailResponse.java (extends Session và thêm details)
export interface StocktakeSessionDetail extends StocktakeSession {
  details: StocktakeAssignment[];
}

// ================= ASSIGNMENT RESPONSE (STAFF) =================
// Khớp với StocktakeShelfAssignmentResponse.java
export interface StocktakeAssignment {
  id: number;
  locationCode: string;
  status: AssignmentStatus;
  staffName?: string;
  startedAt?: string;
  completedAt?: string;
  details: StocktakeDetail[];
}

// Khớp với StocktakeBlindCountResponse.java (Staff đếm mù)
export interface StocktakeBlindCountResponse {
  detailId: number;
  productId: number;
  productSku: string;
  productName: string;
  productImage?: string;
  locationCode: string;
  productUnit: string;
  expiryDate?: string;
  // Không có systemQty để Staff không nhìn thấy tồn kho
}

// ================= REPORT RESPONSE =================
// Khớp với VarianceReportResponse.java
export interface VarianceReportResponse {
  sessionId: number;
  sessionCode: string;
  variances: VarianceItem[];
  totalVarianceItems: number;
  totalShortage: number;
  totalOverage: number;
}

export interface VarianceItem {
  detailId: number;
  productId: number;
  productSku: string;
  productName: string;
  productImage?: string;
  productBarcode?: string;
  locationCode: string;
  staffName?: string;
  systemQty: number;
  actualQty: number;
  variance: number;
}

// ================= REQUESTS =================
export interface CreateStocktakeRequest {
  zoneCode: string;
}

export interface ApproveAdjustmentRequest {
  sessionId: number;
  adjustments?: {
    detailId: number;
    newQuantity: number;
  }[];
}

export interface SubmitCountsRequest {
  items: {
    detailId: number;
    actualQty: number;
  }[];
}

// ================= FRONTEND UI STATE =================
// Interface này dùng để quản lý trạng thái trên màn hình đếm
// Nó kế thừa dữ liệu từ Server và thêm 2 trường để Staff nhập liệu
export interface CountingItem extends StocktakeBlindCountResponse {
  actualQty: number | null; // Số lượng staff nhập (null = chưa nhập)
  isCounted: boolean; // Trạng thái: Đã nhập xong chưa?
}
