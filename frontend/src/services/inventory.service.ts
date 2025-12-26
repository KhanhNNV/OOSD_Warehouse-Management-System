// src/services/inventory.service.ts
import { InventoryItem } from "@/types/inventory";

const mockInventory: InventoryItem[] = [
    { id: "1", productId: "P001", productName: "iPhone 15 Pro Max 256GB", sku: "APL-IP15PM-256", physicalQty: 150, allocatedQty: 45, availableQty: 105, location: "A-01-02" },
    { id: "2", productId: "P002", productName: "Samsung Galaxy S24 Ultra", sku: "SAM-S24U-001", physicalQty: 80, allocatedQty: 30, availableQty: 50, location: "A-02-01" },
    { id: "3", productId: "P003", productName: "MacBook Pro 14 M3", sku: "APL-MBP14M3-001", physicalQty: 25, allocatedQty: 20, availableQty: 5, location: "B-01-01" },
    { id: "4", productId: "P004", productName: "Dell XPS 15 i7", sku: "DELL-XPS15-I7", physicalQty: 40, allocatedQty: 5, availableQty: 35, location: "B-02-03" },
    { id: "5", productId: "P005", productName: "AirPods Pro 2", sku: "APL-APP2-001", physicalQty: 200, allocatedQty: 80, availableQty: 120, location: "C-01-01" },
    { id: "6", productId: "P006", productName: "iPad Pro 12.9 M2", sku: "APL-IPADP-M2", physicalQty: 35, allocatedQty: 35, availableQty: 0, location: "A-03-02" }, // Hết hàng khả dụng
    { id: "7", productId: "P007", productName: "Sony WH-1000XM5", sku: "SNY-WH1K-XM5", physicalQty: 60, allocatedQty: 15, availableQty: 45, location: "C-02-01" },
    { id: "8", productId: "P008", productName: "Logitech MX Master 3S", sku: "LGT-MXM-3S", physicalQty: 100, allocatedQty: 10, availableQty: 90, location: "D-01-02" },
];

export const inventoryService = {
    getInventory: async (): Promise<InventoryItem[]> => {
        return new Promise((resolve) => setTimeout(() => resolve(mockInventory), 500));
    }
};