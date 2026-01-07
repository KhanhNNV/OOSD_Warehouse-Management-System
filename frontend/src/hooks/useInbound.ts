import { useState, useEffect, useCallback } from "react";
import { PurchaseOrder } from "@/types/inbound";
import { toast } from "@/hooks/use-toast";
import {purchaseOrderService} from "@/services/purchaseOrder.service.ts";

export function useInbound() {
    // Luôn khởi tạo là mảng rỗng []
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    const fetchPOs = useCallback(async () => {
        try {
            setIsLoading(true);
            const responseData: any = await purchaseOrderService.getPOs();

            console.log(">>> DỮ LIỆU API TRẢ VỀ:", responseData); // 👈 Quan trọng: Xem log này ở F12

            // Logic kiểm tra thông minh để lấy đúng mảng dữ liệu
            if (Array.isArray(responseData)) {
                // Trường hợp 1: API trả về mảng trực tiếp [{}, {}]
                setOrders(responseData);
            } else if (responseData && Array.isArray(responseData.data)) {
                // Trường hợp 2: API trả về dạng gói { message: "OK", data: [{}, {}] }
                setOrders(responseData.data);
            } else if (responseData && Array.isArray(responseData.content)) {
                // Trường hợp 3: API phân trang { content: [{}, {}], page: 1 }
                setOrders(responseData.content);
            } else {
                console.warn("Không tìm thấy mảng dữ liệu hợp lệ, set về rỗng.");
                setOrders([]);
            }

        } catch (error) {
            console.error("Lỗi khi tải danh sách PO:", error);
            // toast.error("Không thể tải dữ liệu");
            setOrders([]); // Gặp lỗi thì set rỗng để không bị crash trang
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPOs();
    }, [fetchPOs]);

    const handleFileUpload = (file: File) => {
        // (Giữ nguyên logic cũ của bạn)
        toast({
            title: "Lỗi",
            description: "Tính năng đang phát triển",
            variant: "destructive",
        });
    };

    // 🛡️ CHỐT CHẶN AN TOÀN: Đảm bảo orders luôn là mảng trước khi filter
    const safeOrders = Array.isArray(orders) ? orders : [];

    const filteredOrders = safeOrders.filter(po =>
        (po.poNumber?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (po.supplierName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
    );

    return {
        orders: filteredOrders,
        searchTerm,
        setSearchTerm,
        isLoading,
        handleFileUpload,
        refreshData: fetchPOs
    };
}