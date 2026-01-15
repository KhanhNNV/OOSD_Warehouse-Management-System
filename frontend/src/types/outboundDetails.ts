
export interface PickingTask {
    id: number;
    productId: number;
    productName: string;
    productSku: string;
    requestedQty: number;
    pickupQty:number;
    imageUrl?: string;

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
    requestedQty: number;
    pickupQty: number;
    imageUrl: string;
    recommendedLocationId: number | null;
    recommendedLocationCode: string | null;
}

