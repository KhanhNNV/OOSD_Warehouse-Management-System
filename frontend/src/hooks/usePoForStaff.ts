import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { PurchaseOrder } from "@/types/poForStaff.ts";
import { toast } from "@/hooks/use-toast";
import { inboundService } from "@/services/inbound.service.ts";
import { usePagination } from "@/hooks/usePagination";
import { handleErrorApi } from "@/hooks/error-helper.ts";

export function usePoForStaff() {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const [isCreating, setIsCreating] = useState(false);

    const fetchPOs = useCallback(async () => {
        try {
            setIsLoading(true);
            const responseData: any = await inboundService.getPOs();

            if (Array.isArray(responseData)) {
                setOrders(responseData);
            } else if (responseData && Array.isArray(responseData.data)) {
                setOrders(responseData.data);
            } else if (responseData && Array.isArray(responseData.content)) {
                setOrders(responseData.content);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Lỗi khi tải danh sách PO:", error);
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    const handleStartCheck = async (poId: number | string) => {
        if (isCreating) return; // Chặn click đúp

        try {
            setIsCreating(true);
            await inboundService.createInboundNote(poId);
            navigate(`/staff/scanning?id=${poId}`);
        } catch (error: any) {
            handleErrorApi(error, "Không thể tạo phiếu kiểm hàng");
        } finally {
            setIsCreating(false);
        }
    };

    const handleFileUpload = (file: File) => {
        toast({
            title: "Lỗi",
            description: "Tính năng đang phát triển",
            variant: "destructive",
        });
    };

    // Logic lọc và sort (giữ nguyên)
    const safeOrders = Array.isArray(orders) ? orders : [];
    const processedOrders = useMemo(() => {
        let result = safeOrders.filter(po =>
            (po.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
            (po.supplierName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
        );

        result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
        return result;
    }, [safeOrders, searchTerm]);

    // Phân trang
    const {
        currentData,
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(processedOrders, 5);

    return {
        orders: currentData,
        searchTerm,
        setSearchTerm,
        isLoading,
        handleFileUpload,
        refreshData: fetchPOs,
        pagination: {
            currentPage,
            totalPages,
            onPageChange: goToPage,
            totalItems
        },
        handleStartCheck,
        isCreating
    };
}