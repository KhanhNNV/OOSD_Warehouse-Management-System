import {POStatus} from "@/types/purchase-order.ts";

export interface PoDetail {
    id: number;
    productId: number;
    productSku: string;
    productName: string;
}

export interface PurchaseOrder {
    id: number;
    poNumber: string;
    supplierName: string;
    status: POStatus;
    expectedDate?: string;
    createdBy: string;
    createdByName: string;
    totalItems: number;
    createdAt?: string;

    details: PoDetail[];

    // Các trường optional (nếu có logic xử lý ở frontend)
    assigneeName?: string;
    retryCount?: number;
    hasVariance?: boolean;
}