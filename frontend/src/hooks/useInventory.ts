// src/hooks/useInventory.ts
import { useState, useEffect, useMemo } from "react";
import { InventoryItem, InventoryStats, SortConfig, SortField } from "@/types/inventory";
import { inventoryService } from "@/services/inventory.service";

export function useInventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, order: 'desc' });
    const [isLoading, setIsLoading] = useState(true);

    // 1. Fetch Data
    useEffect(() => {
        inventoryService.getInventory().then((data) => {
            setItems(data);
            setIsLoading(false);
        });
    }, []);

    // 2. Calculate Stats (Dựa trên toàn bộ danh sách gốc - Global Stats)
    const stats: InventoryStats = useMemo(() => {
        return items.reduce(
            (acc, item) => ({
                totalPhysical: acc.totalPhysical + item.physicalQty,
                totalAllocated: acc.totalAllocated + item.allocatedQty,
                totalAvailable: acc.totalAvailable + item.availableQty,
                lowStockCount: acc.lowStockCount + (item.availableQty > 0 && item.availableQty <= 10 ? 1 : 0),
                outOfStockCount: acc.outOfStockCount + (item.availableQty === 0 ? 1 : 0),
            }),
            { totalPhysical: 0, totalAllocated: 0, totalAvailable: 0, lowStockCount: 0, outOfStockCount: 0 }
        );
    }, [items]);

    // 3. Filter & Sort Logic
    const processedInventory = useMemo(() => {
        let result = [...items];

        // Filter
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(
                (item) =>
                    item.productName.toLowerCase().includes(lowerTerm) ||
                    item.sku.toLowerCase().includes(lowerTerm)
            );
        }

        // Sort
        if (sortConfig.field) {
            result.sort((a, b) => {
                const field = sortConfig.field as keyof InventoryItem;
                const valA = a[field];
                const valB = b[field];

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortConfig.order === 'asc' ? valA - valB : valB - valA;
                }
                // Fallback cho string (nếu cần sort theo tên)
                return 0;
            });
        }

        return result;
    }, [items, searchTerm, sortConfig]);

    // Handler đổi chiều sắp xếp
    const handleSort = (field: SortField) => {
        setSortConfig((current) => ({
            field,
            order: current.field === field && current.order === 'desc' ? 'asc' : 'desc',
        }));
    };

    return {
        inventory: processedInventory,
        stats,
        searchTerm,
        setSearchTerm,
        sortConfig,
        handleSort,
        isLoading
    };
}