// src/types/outboundDetails.ts
export interface PickingTask {
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    requested_qty: number;
    

    locationId: number | null;   
    locationCode: string | null;

    status: 'PENDING' | 'COMPLETED' | 'FLAGGED';
    pickedQty?: number;
    note?: string;
}


export interface OutboundDetailDTO {
    id: number;
    productId: number;
    productSku: string;
    productName: string;
    unit: string;
    requested_qty: number;
    recommendedLocationId: number | null;
    recommendedLocationCode: string | null;
}
