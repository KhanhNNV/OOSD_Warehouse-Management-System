import { useState, useEffect, useCallback } from "react";
import { PurchaseOrder, Supplier } from "@/types/purchase-order.ts";
import { purchaseOrderService } from "@/services/purchaseOrder.service";
import { toast } from "@/hooks/use-toast"; // Đã thay thế import

export function usePO() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // State upload
    const [isUploading, setIsUploading] = useState(false);



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
            const msg = error.response?.data?.message || "Lỗi khi upload file";
            toast({
                title: "Lỗi upload",
                description: msg,
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };


    // Filter logic client-side
    const filteredOrders = orders.filter(
        (po) =>
            po.poNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            po.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        orders: filteredOrders,
        suppliers,
        searchTerm,
        setSearchTerm,
        isLoading,
        isUploading,
        refreshData: fetchData,
        handleUploadPO,
    };
}