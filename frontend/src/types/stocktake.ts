// ================= COMMON =================
// Định nghĩa luôn ApiResponse ở đây để không phải import lung tung
export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

export type StocktakeStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type AssignmentStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'DRAFF';

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
  locationId: number;
  locationCode: string;
  systemQtySnapshot: number;
  actualCountedQty?: number;
  variance?: number;
}

// Khớp với StocktakeSessionDetailResponse.java (extends Session và thêm details)
export interface StocktakeSessionDetail extends StocktakeSession {
  details: StocktakeDetail[];
}

// ================= ASSIGNMENT RESPONSE (STAFF) =================
// Khớp với StocktakeShelfAssignmentResponse.java
export interface StocktakeAssignment {
  id: number;
  sessionId: number;
  sessionCode: string;
  locationCode: string;
  status: AssignmentStatus;
  staffName?: string;
  startedAt?: string;
}

// Khớp với StocktakeBlindCountResponse.java (Staff đếm mù)
export interface StocktakeBlindCountResponse {
  detailId: number;
  productId: number;
  productSku: string;
  productName: string;
  productImage?: string;
  locationCode: string;
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
  locationCode: string;
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
}

export interface SubmitCountsRequest {
  items: {
    detailId: number;
    actualQty: number;
  }[];
}