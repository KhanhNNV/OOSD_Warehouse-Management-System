//=============ENUM=======================
export enum StocktakeStatus {
  DRAFT = "DRAFT",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  ADJUSTED = "ADJUSTED",
}
export enum AssignmentStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}

//=============TYPES RESPONSE=======================

//- Thông tin chung về Phiên kiểm kê
export interface StocktakeSession {
  id: number;
  code: string;
  status: StocktakeStatus;
zoneCode?:string;
  totalItems?: number; // Tổng số sản phẩm cần kiểm
  countedItems?: number; //Số đã đếm
  varianceCount?: number; // Số hàng bị chêch lệch

  startedAt?: string;
  completedAt?: string;

  createdBy?: string;
}
//- Chi tiết từng dòng sản phẩm(Dùng cho Manager xem báo cáo)
export interface StocktakeDetails {
  id: number;
  sessionId: number;
  productSku: string;
  productName: string;
  productImage: string;

  locationId: number;
  locationCode: string;

  systemQtySnapshot: number;
  actualCountedQty: number;
  variance: number;
}
//- Nhiệm vụ kiểm kê (Một cái kệ cụ thể)
export interface StocktakeShelfAssignment {
  id: number;
  sessionId: number;
  sessionCode: string;
  locationId: number;
  locationCode: string;
  status: AssignmentStatus;
  staffName: string | null;
  details?: StocktakeDetails[];// Fiel này có thể null/underfined 
}
//- View chi tiết phiên (Danhd cho trang detail của manager)
export interface StocktakeSessionDetailsView extends StocktakeSession {
  assignments: StocktakeShelfAssignment[];
}
// ================= STAFF SPECIFIC =================
//- Cho đếm mù cho staff khi kiểm kê
export interface StocktakeBlind {
  detailId: number;
  productId: number;
  productName: string;
  productSku: string;
  productImage: string;
  unit: string;
  locationCode: string;
  acutalCountedQty: number | null;// Fiel này có thể null/underfined 
}

// ================= REPORTING =================
export interface VarianceItems {
  detailId: number;
  productId: number;
  productName: string;
  productSku: string;
  locationCode: string;

  systemQty: number;
  actualQty: number;
  variance: number;
}

export interface VarianceReports {
  sessionId: number;
  sessionCode: number;

  variances: VarianceItems[];

  totalCarianceItems: number;
  totalShortage: number; // Tổng thiếu (tổng variance âm)
  totalOverage: number; // Tổng thừa (tổng variance dương)
}


//============TYPES RESQUEST=====================
//- (Manager) Resquest tạo phiếu kiểm kho (ZONE)
export interface CreateStocktakeRequest {
  type: string; // 'ZONE'
  zoneCode?: string;
}

//- Gửi lên khi staff hoàn thành việc đếm hàng cho 1 shelf
export interface SubmitCountsRequest {
  assignmentId: number;
  items: {
    detailId: number;
    productId: number;
    actualQty: number;
  }[];
}

// export interface ApproveAdjustmentRequest {
//     sessionId: number;
// }
