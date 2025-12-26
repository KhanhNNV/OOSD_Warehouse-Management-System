// src/types/inventory.ts

export interface InventoryItem {
    id: string;
    productId: string;
    productName: string;
    sku: string;
    location: string;      // Vị trí trong kho (VD: A-01-02)
    physicalQty: number;   // Số lượng thực tế trên kệ
    allocatedQty: number;  // Số lượng đã bị đơn hàng "xí phần"
    availableQty: number;  // Số lượng còn lại có thể bán (Physical - Allocated)
}

export interface InventoryStats {
    totalPhysical: number;
    totalAllocated: number;
    totalAvailable: number;
    lowStockCount: number; // Số sản phẩm sắp hết (<= 10)
    outOfStockCount: number; // Số sản phẩm đã hết (= 0)
}

export type SortField = 'physical' | 'available' | 'productName';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
    field: SortField | null;
    order: SortOrder;
}