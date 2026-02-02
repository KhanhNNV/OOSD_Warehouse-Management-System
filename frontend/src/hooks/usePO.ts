import {useState, useEffect, useCallback, useMemo} from "react";
import { PurchaseOrder, Supplier } from "@/types/purchase-order.ts";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { toast } from "@/hooks/use-toast";
import {usePagination} from "@/hooks/usePagination.ts";

export function usePO() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State upload & Action
    const [isUploading, setIsUploading] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSupplierId, setFilterSupplierId] = useState<string>("all");

    // 1. Thêm State cho filter người tạo
    const [filterCreator, setFilterCreator] = useState<string>("all");

    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Hàm load dữ liệu
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [poData, supplierData] = await Promise.all([
                purchaseOrderService.getPOs(),
                purchaseOrderService.getSuppliers()
            ]);
            setOrders(poData);
            setSuppliers(supplierData);
        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi",
                description: "Không thể tải dữ liệu hệ thống",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // 2. Tạo danh sách người tạo duy nhất từ danh sách Orders hiện có
    // Giúp hiển thị trong Dropdown mà không cần gọi thêm API User
    const creators = useMemo(() => {
        const uniqueMap = new Map<string, string>();
        orders.forEach(po => {
            if (po.createdBy) {
                // Key là ID, Value là Tên hiển thị
                uniqueMap.set(po.createdBy, po.createdByName || po.createdBy);
            }
        });

        // Chuyển Map thành mảng object để dễ map trong UI
        return Array.from(uniqueMap.entries()).map(([id, name]) => ({
            id,
            name
        }));
    }, [orders]);

    // Logic Upload
    const handleUploadPO = async (file: File, supplierId: string, onSuccess: () => void) => {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast({ title: "Định dạng không hợp lệ", description: "Chỉ chấp nhận file Excel (.xlsx, .xls)", variant: "destructive" });
            return;
        }
        if (!supplierId) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng chọn Nhà cung cấp", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const newPO = await purchaseOrderService.uploadPoFromExcel(file, Number(supplierId));
            setOrders((prev) => [newPO, ...prev]);
            toast({ title: "Thành công", description: `Tạo đơn ${newPO.poNumber} thành công!` });
            onSuccess();
        } catch (error: any) {
            const msg = error.response?.data?.details || "Lỗi khi upload file";
            toast({ title: "Lỗi upload", description: msg, variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    // Logic Cancel
    const cancelPO = async (id: number | string, onSuccess?: () => void) => {
        setIsCancelling(true);
        try {
            await purchaseOrderService.cancelPurchaseOrder(id);
            toast({ title: "Thành công", description: `Đã hủy đơn hàng thành công`, className: "bg-green-500 text-white" });
            await fetchData();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.response?.data?.details || "Không thể hủy đơn hàng này.", variant: "destructive" });
        } finally {
            setIsCancelling(false);
        }
    };

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredOrders = useMemo(() => {
        const result = orders.filter((po) => {
            // Filter Search Term
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                po.poNumber?.toLowerCase().includes(searchLower) ||
                po.supplierName?.toLowerCase().includes(searchLower);

            if (!matchesSearch) return false;

            // Filter Status
            if (filterStatus !== "all" && po.status !== filterStatus) {
                return false;
            }

            // Filter Supplier
            if (filterSupplierId !== "all" && po.supplierId !== Number(filterSupplierId)) {
                return false;
            }

            // 3. Filter Creator (Người tạo)
            if (filterCreator !== "all" && po.createdBy !== filterCreator) {
                return false;
            }

            // Filter Date Range
            if (filterFromDate) {
                const poDate = new Date(po.createdAt || "").setHours(0,0,0,0);
                const fromDate = new Date(filterFromDate).setHours(0,0,0,0);
                if (poDate < fromDate) return false;
            }

            if (filterToDate) {
                const poDate = new Date(po.createdAt || "").setHours(0,0,0,0);
                const toDate = new Date(filterToDate).setHours(0,0,0,0);
                if (poDate > toDate) return false;
            }

            return true;
        });

        // Sort mới nhất lên đầu
        return result.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0).getTime();
            const dateB = new Date(b.createdAt || 0).getTime();
            return dateB - dateA;
        });

    }, [orders, searchTerm, filterStatus, filterSupplierId, filterCreator, filterFromDate, filterToDate]);

    //phân trang
    const pagination = usePagination(filteredOrders, 10);

    // 4. Hàm Reset bộ lọc
    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterSupplierId("all");
        setFilterCreator("all"); // Reset creator
        setFilterFromDate("");
        setFilterToDate("");
    };

    return {
        orders: pagination.currentData,
        allFilteredOrders: filteredOrders,
        suppliers,
        creators,
        isLoading,

        // Actions
        refreshData: fetchData,
        handleUploadPO,
        cancelPO,

        // Status states
        isUploading,
        isCancelling,

        // Filter states & setters
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterSupplierId, setFilterSupplierId,
        filterCreator, setFilterCreator,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,

        pagination: {
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            goToPage: pagination.goToPage,
            nextPage: pagination.nextPage,
            prevPage: pagination.prevPage,
            totalItems: pagination.totalItems
        },
    };
}