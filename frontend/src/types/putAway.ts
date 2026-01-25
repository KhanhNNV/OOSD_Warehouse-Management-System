export interface PutAwayRequest {
  productId: number;
  quantity: number;
  targetShelfCode: string;
  expiryDate?: string;
  markLocationFull?: boolean; // ✅ NEW: Đánh dấu kệ đầy
}

export type PutAwayStep = "SCAN_PRODUCT" | "INPUT_DETAILS" | "SCAN_LOCATION";

export interface TransitItem {
  productId: number;
  productName: string;
  barcode: string;
  sku: string;
  quantity: number; // Số lượng max đang giữ
}

export interface PutAwaySession {
  step: PutAwayStep;
  selectedItem: TransitItem | null; // Item được chọn từ Transit
  inputQuantity: number;
  expDate: string;
}
