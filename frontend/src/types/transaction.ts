export interface InventoryTransaction {
    id: number;
    type: string; // Enum
    productName: string;
    productSku: string;
    locationCode: string;
    quantityBefore: number;
    quantityChanged: number;
    quantityAfter: number;
    referenceDocId: string;
    createdDate: string;
    performedBy: string;
}

export interface TransactionParams {
    page: number;
    size: number;
    fromDate?: string;
    toDate?: string;
    type?: string;
}