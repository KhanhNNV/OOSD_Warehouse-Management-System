// src/types/picking.ts

export interface LocationResponse {
    id: number;
    code: string;
    locationType: 'STAGE_LOC' | 'SHELF_STORAGE' | 'TRANSIT' | string;
}

export interface PickingItem {
    // Dữ liệu từ API Product
    productId: number;
    productName: string;
    barcode: string;
    sku: string;
    image?: string; // Nếu có

    // Dữ liệu nhập liệu
    inputQty: number;

    // Dữ liệu ngữ cảnh (lấy từ đâu)
    stageLocationId: number;
    stageLocationCode: string;
}

// Payload gửi xuống Backend
export interface InternalPickRequest {
    productId: number;
    quantity: number;
    stageLocationId: number;
}