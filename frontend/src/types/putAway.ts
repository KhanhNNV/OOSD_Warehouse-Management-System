// src/types/putaway.ts

export interface PutAwayRequest {
    productId: number;
    quantity: number;
    targetShelfCode: string; // Mã code của kệ (VD: A-01-01)
    manufactureDate?: string; // Format YYYY-MM-DD
    expiryDate?: string;      // Format YYYY-MM-DD
}

// Trạng thái của quy trình Cất hàng
export type PutAwayStep = 'SCAN_PRODUCT' | 'INPUT_DETAILS' | 'SCAN_LOCATION';

export interface PutAwaySession {
    step: PutAwayStep;
    product: any | null; // Dữ liệu sản phẩm đã quét
    quantity: number;
    mfgDate: string; // YYYY-MM-DD
    expDate: string; // YYYY-MM-DD
}