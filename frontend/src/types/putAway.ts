import {ProductScanResponse} from "@/types/product.ts";

export interface LocationResponse {
    id: number;
    code: string;
    type: string; // 'SHELF_STORAGE', 'STAGE_LOC', etc.
}

export interface ScannedItem extends ProductScanResponse {
    inputQty: number;
    // Put Away cần thêm thông tin này
    targetShelfCode?: string;
    manufactureDate?: string; // YYYY-MM-DD
    expiryDate?: string;      // YYYY-MM-DD

    // UI logic
    tempId?: string; // Để quản lý xóa sửa dễ hơn trong list
}