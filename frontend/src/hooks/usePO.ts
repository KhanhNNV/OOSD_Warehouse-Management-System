import {useState, useEffect, useCallback, useMemo} from "react";
import { PurchaseOrder, Supplier } from "@/types/purchase-order.ts";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { toast } from "@/hooks/use-toast"; // Đã thay thế import

export function usePO() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // State upload
    const [isUploading, setIsUploading] = useState(false);

    const [isCancelling, setIsCancelling] = useState(false);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterSupplierId, setFilterSupplierId] = useState<string>("all");
    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Hàm load dữ liệu
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Giả định API getPOs bây giờ trả về list kèm details
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

    // --- LOGIC UPLOAD MỚI ---
    const handleUploadPO = async (
        file: File,
        supplierId: string,
        onSuccess: () => void
    ) => {
        // 1. Validate File
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast({
                title: "Định dạng không hợp lệ",
                description: "Chỉ chấp nhận file Excel (.xlsx, .xls)",
                variant: "destructive",
            });
            return;
        }

        // 2. Validate Supplier
        if (!supplierId) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng chọn Nhà cung cấp",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            const newPO = await purchaseOrderService.uploadPoFromExcel(file, Number(supplierId));

            // Backend trả về newPO đã có details, thêm vào list luôn
            setOrders((prev) => [newPO, ...prev]);

            toast({
                title: "Thành công",
                description: `Tạo đơn ${newPO.poNumber} thành công!`,
            });
            onSuccess();
        } catch (error: any) {
            const msg = error.response?.data?.details || "Lỗi khi upload file";
            toast({
                title: "Lỗi upload",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const cancelPO = async (id: number | string, onSuccess?: () => void) => {
        setIsCancelling(true);
        try {
            await purchaseOrderService.cancelPurchaseOrder(id);

            toast({
                title: "Thành công",
                description: `Đã hủy đơn hàng thành công`,
                className: "bg-green-500 text-white"
            });

            // Refresh lại list sau khi hủy
            await fetchData();

            if (onSuccess) onSuccess();

        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.response?.data?.details || "Không thể hủy đơn hàng này.",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };


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

            // Filter Date Range
            if (filterFromDate) {
                const poDate = new Date(po.createdAt).setHours(0,0,0,0);
                const fromDate = new Date(filterFromDate).setHours(0,0,0,0);
                if (poDate < fromDate) return false;
            }

            if (filterToDate) {
                const poDate = new Date(po.createdAt).setHours(0,0,0,0);
                const toDate = new Date(filterToDate).setHours(0,0,0,0);
                if (poDate > toDate) return false;
            }

            return true;
        });

        return result.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // B trừ A để ra số dương nếu B mới hơn A
        });

    }, [orders, searchTerm, filterStatus, filterSupplierId, filterFromDate, filterToDate]);

    // Hàm Reset bộ lọc
    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterSupplierId("all");
        setFilterFromDate("");
        setFilterToDate("");
    };

    return {
        orders: filteredOrders,
        suppliers,
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
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters
    };
}