// src/types/picking.ts
export type PickingTaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FLAGGED';

export interface PickingTask {
  taskId: string;        // ID duy nhất của dòng nhiệm vụ
  productName: string;
  productSku: string;
  productImage?: string; // URL ảnh (nếu có)
  locationCode: string;  // Vị trí kệ (VD: A-01-01)
  requestQty: number;    // Số lượng cần lấy
  
  // Dữ liệu nhân viên thực hiện (Client-side update)
  pickedQty?: number;
  status: PickingTaskStatus;
  note?: string;         // Ghi chú khi báo lỗi
}
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