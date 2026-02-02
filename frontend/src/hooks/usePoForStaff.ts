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
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSupplier, setFilterSupplier] = useState<string>("all");
    const [filterCreator, setFilterCreator] = useState<string>("all");
    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Fetch API
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

    // --- LẤY DANH SÁCH NHÀ CUNG CẤP DUY NHẤT (Để đổ vào Dropdown) ---
    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set<string>();
        orders.forEach(po => {
            if (po.supplierName) suppliers.add(po.supplierName);
        });
        return Array.from(suppliers).sort();
    }, [orders]);

    const uniqueCreators = useMemo(() => {
        const set = new Set<string>();
        orders.forEach(po => { if (po.createdByName) set.add(po.createdByName); });
        return Array.from(set).sort();
    }, [orders]);

    // --- LOGIC LỌC DỮ LIỆU ---
    const safeOrders = Array.isArray(orders) ? orders : [];

    const processedOrders = useMemo(() => {
        let result = safeOrders;

        // 1. Search Term (Mã PO, NCC, Người tạo)
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(po =>
                (po.poNumber?.toLowerCase() || "").includes(lowerTerm) ||
                (po.supplierName?.toLowerCase() || "").includes(lowerTerm) ||
                (po.createdByName?.toLowerCase() || "").includes(lowerTerm)
            );
        }

        // 2. Filter Status
        if (filterStatus !== "all") {
            result = result.filter(po => po.status === filterStatus);
        }

        // 3. Filter Supplier
        if (filterSupplier !== "all") {
            result = result.filter(po => po.supplierName === filterSupplier);
        }

        if (filterCreator !== "all") {
            result = result.filter(po => po.createdByName === filterCreator);
        }

        // 4. Filter Date Range (Dựa trên createdAt)
        if (filterFromDate) {
            const fromDate = new Date(filterFromDate).setHours(0, 0, 0, 0);
            result = result.filter(po => {
                if (!po.createdAt) return false;
                const date = new Date(po.createdAt).setHours(0, 0, 0, 0);
                return date >= fromDate;
            });
        }

        if (filterToDate) {
            const toDate = new Date(filterToDate).setHours(0, 0, 0, 0);
            result = result.filter(po => {
                if (!po.createdAt) return false;
                const date = new Date(po.createdAt).setHours(0, 0, 0, 0);
                return date <= toDate;
            });
        }

        // 5. Sort: Mới nhất lên đầu
        return result.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    }, [safeOrders, searchTerm, filterStatus, filterSupplier,filterCreator, filterFromDate, filterToDate]);

    // --- PHÂN TRANG ---
    // Gọi hook phân trang SAU KHI đã lọc dữ liệu
    const {
        currentData,
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(processedOrders, 10);

    // Hàm Reset bộ lọc
    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterSupplier("all");
        setFilterCreator("all");
        setFilterFromDate("");
        setFilterToDate("");
        goToPage(1);
    };

    const handleStartCheck = async (poId: number | string) => {
        if (isCreating) return;
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
        toast({ title: "Lỗi", description: "Tính năng đang phát triển", variant: "destructive" });
    };

    return {
        orders: currentData, // Dữ liệu đã phân trang
        uniqueSuppliers,     // Danh sách NCC để hiển thị dropdown
        uniqueCreators,
        isLoading,
        handleFileUpload,
        refreshData: fetchPOs,
        handleStartCheck,
        isCreating,

        // Filter exports
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterSupplier, setFilterSupplier,
        filterCreator, setFilterCreator,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,

        // Pagination exports
        pagination: {
            currentPage,
            totalPages,
            onPageChange: goToPage,
            totalItems
        }
    };
}