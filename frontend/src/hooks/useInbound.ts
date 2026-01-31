import { useState, useEffect, useMemo, useCallback } from 'react';
import { InboundNoteResponse } from '../types/inbound';
import { inboundService } from '../services/inbound.service';
import { handleErrorApi } from "@/hooks/error-helper.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";

export const useMyInboundNotes = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<InboundNoteResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Hàm fetch data
    const fetchMyNotes = useCallback(async () => {
        setLoading(true);
        try {
            const result = await inboundService.getMyInboundNotes();
            setData(result);
            setError(null);
        } catch (err: any) {
            handleErrorApi(err, "Không thể tải danh sách phiếu nhập");
            setError("Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyNotes();
    }, [fetchMyNotes]);

    // --- LOGIC LỌC & SẮP XẾP ---
    const processedData = useMemo(() => {
        let result = [...data];

        // 1. Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(ib =>
                (ib.noteNumber?.toLowerCase() || "").includes(lowerTerm) ||
                (ib.poNumber?.toLowerCase() || "").includes(lowerTerm)
            );
        }

        // 2. Filter Status
        if (filterStatus !== "all") {
            result = result.filter(ib => ib.status === filterStatus);
        }

        // 3. Filter Date
        if (filterFromDate) {
            const fromDate = new Date(filterFromDate).setHours(0, 0, 0, 0);
            result = result.filter(ib => {
                if (!ib.receivedDate) return false;
                const date = new Date(ib.receivedDate).setHours(0, 0, 0, 0);
                return date >= fromDate;
            });
        }

        if (filterToDate) {
            const toDate = new Date(filterToDate).setHours(0, 0, 0, 0);
            result = result.filter(ib => {
                if (!ib.receivedDate) return false;
                const date = new Date(ib.receivedDate).setHours(0, 0, 0, 0);
                return date <= toDate;
            });
        }

        // 4. SORT (CẬP NHẬT): Chưa có ngày thực hiện -> Lên đầu
        result.sort((a, b) => {
            // Case 1: Cả 2 đều chưa có ngày -> Xếp theo ID mới nhất (hoặc giữ nguyên)
            if (!a.receivedDate && !b.receivedDate) return b.id - a.id;

            // Case 2: A chưa có ngày -> A lên đầu (return -1)
            if (!a.receivedDate) return -1;

            // Case 3: B chưa có ngày -> B lên đầu (return 1)
            if (!b.receivedDate) return 1;

            // Case 4: Cả 2 có ngày -> Ngày mới nhất lên trên
            return new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime();
        });

        return result;
    }, [data, searchTerm, filterStatus, filterFromDate, filterToDate]);

    // --- PHÂN TRANG ---
    const {
        currentData,
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(processedData, 10);

    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterFromDate("");
        setFilterToDate("");
        goToPage(1);
    };

    // ... (Giữ nguyên các hàm action: handleStartCheck, cancelInboundNote) ...
    const handleStartCheck = async (poId: number | string) => {
        if (isCreating) return;
        try {
            setIsCreating(true);
            navigate(`/staff/scanning?id=${poId}`);
        } catch (error: any) {
            handleErrorApi(error, "Không thể tạo phiếu kiểm hàng");
        } finally {
            setIsCreating(false);
        }
    };

    const cancelInboundNote = async (id: number | string, onSuccess?: () => void) => {
        setIsCancelling(true);
        try {
            await inboundService.cancelInbound(id);
            toast({
                title: "Thành công",
                description: "Đã hủy phiếu nhập kho.",
                className: "bg-green-600 text-white border-none"
            });
            await fetchMyNotes();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.response?.data?.details || "Không thể hủy phiếu này.",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    return {
        data: currentData,
        loading,
        error,
        refetch: fetchMyNotes,
        handleStartCheck,
        isCreating,
        cancelInboundNote,
        isCancelling,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,
        pagination: {
            currentPage,
            totalPages,
            onPageChange: goToPage,
            totalItems
        },
    };
};