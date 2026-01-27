export interface RelocateRequest {
    barcode: string;
    fromLocationCode: string;
    toLocationCode: string;
    quantity: number;
}

export interface RelocatedItemLog {
    id: string;
    barcode: string;
    productName?: string;
    from: string;
    to: string;
    quantity: number;
    status: 'SUCCESS' | 'ERROR';
    message?: string;
    timestamp: Date;
}