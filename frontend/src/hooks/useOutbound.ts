import { useState, useEffect, useMemo, useCallback } from "react";
import { outboundService } from "@/services/outbound.service";
import { OutboundOrder } from "@/types/outbound";
import { useToast } from "@/hooks/use-toast";
import {usePagination} from "@/hooks/usePagination.ts";

export function useOutbound() {
    const { toast } = useToast();
    const [orders, setOrders] = useState<OutboundOrder[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterPicker, setFilterPicker] = useState<string>("all");
    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            // Giả sử API lấy tất cả đơn hoặc có hỗ trợ phân trang/lọc phía server
            // Ở đây ta lấy list về và lọc client-side
            const data = await outboundService.getPendingOrders();
            setOrders(data);
        } catch (error: any) {
            toast({
                title: "Lỗi kết nối",
                description: error.response?.data?.details || "Không thể tải danh sách đơn hàng",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // --- TRÍCH XUẤT DANH SÁCH NGƯỜI PHỤ TRÁCH DUY NHẤT ---
    const uniquePickers = useMemo(() => {
        const pickers = new Set<string>();
        orders.forEach(order => {
            if (order.assignedPickerName) {
                pickers.add(order.assignedPickerName);
            }
        });
        return Array.from(pickers).sort(); // Sắp xếp tên A-Z
    }, [orders]);

    // --- LOGIC LỌC VÀ SẮP XẾP ---
    const filteredOrders = useMemo(() => {
        let result = orders;

        // Filter Search Term
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(order =>
                order.orderNumber.toLowerCase().includes(lowerTerm) ||
                order.toName.toLowerCase().includes(lowerTerm) ||
                order.toPhone?.includes(lowerTerm)
            );
        }

        // Filter Status
        if (filterStatus !== "all") {
            result = result.filter(order => order.status === filterStatus);
        }

        // Filter Picker
        if (filterPicker !== "all") {
            if (filterPicker === "unassigned") {
                // Lọc đơn chưa ai nhận
                result = result.filter(order => !order.assignedPickerName);
            } else {
                // Lọc theo tên cụ thể
                result = result.filter(order => order.assignedPickerName === filterPicker);
            }
        }

        // Filter Date Range
        if (filterFromDate) {
            const fromDate = new Date(filterFromDate).setHours(0, 0, 0, 0);
            result = result.filter(order => {
                const orderDate = new Date(order.createdDate || order.exportedDate).setHours(0, 0, 0, 0);
                return orderDate >= fromDate;
            });
        }

        if (filterToDate) {
            const toDate = new Date(filterToDate).setHours(0, 0, 0, 0);
            result = result.filter(order => {
                const orderDate = new Date(order.createdDate || order.exportedDate).setHours(0, 0, 0, 0);
                return orderDate <= toDate;
            });
        }

        // Sort: Mới nhất lên đầu
        return result.sort((a, b) => {
            const dateA = new Date(a.createdDate || a.exportedDate).getTime();
            const dateB = new Date(b.createdDate || b.exportedDate).getTime();
            return dateB - dateA;
        });

    }, [orders, searchTerm, filterStatus,filterPicker, filterFromDate, filterToDate]);

    //Phân trang
    const {
        currentData: paginatedOrders,
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(filteredOrders, 10);

    // Stats calculation (Tính trên toàn bộ orders gốc)
    const stats = useMemo(() => ({
        new: orders.filter(o => o.status === "NEW").length,
        processing: orders.filter(o => ["ALLOCATED", "PICKING", "PACKED"].includes(o.status)).length,
        shipped: orders.filter(o => o.status === "SHIPPED").length
    }), [orders]);

    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterPicker("all");
        setFilterFromDate("");
        setFilterToDate("");
        goToPage(1);
    };

    return {
        orders: paginatedOrders,
        allOrdersCount: filteredOrders.length,
        uniquePickers,
        isLoading,
        stats,
        refetch: fetchOrders,
        // Filter exports
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterPicker, setFilterPicker,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,

        pagination: {
            currentPage,
            totalPages,
            goToPage,
            totalItems
        }
    };
}