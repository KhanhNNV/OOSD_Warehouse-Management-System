import {useState, useEffect, useCallback, useMemo} from 'react';
import { inboundService } from '@/services/inbound.service';
import { InboundNoteResponse } from '@/types/inbound';
import { toast } from "@/hooks/use-toast";

export const useInboundManager = () => {
    const [inboundNotes, setInboundNotes] = useState<InboundNoteResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // --- FILTER STATES ---
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [filterFromDate, setFilterFromDate] = useState<string>("");
    const [filterToDate, setFilterToDate] = useState<string>("");

    // Hàm lấy danh sách phiếu
    const fetchInboundNotes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await inboundService.getAllInboundNotes();
            // Sắp xếp theo ngày mới nhất
            const sortedData = data.sort((a, b) =>
                new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
            );
            setInboundNotes(sortedData);
        } catch (error: any) {
            const res = error.response?.data;
            console.error(error);
            toast({
                title: "Không thể tải danh sách phiếu nhập.",
                description: res?.details || "Lỗi kết nối server",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Load dữ liệu khi mount
    useEffect(() => {
        fetchInboundNotes();
    }, [fetchInboundNotes]);

    // --- LOGIC LỌC DỮ LIỆU ---
    const filteredNotes = useMemo(() => {
        return inboundNotes.filter((item) => {
            // 1. Filter Search Term
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch =
                item.noteNumber.toLowerCase().includes(lowerTerm) ||
                item.poNumber.toLowerCase().includes(lowerTerm) ||
                item.processedBy?.toLowerCase().includes(lowerTerm);

            if (!matchesSearch) return false;

            // 2. Filter Status
            if (filterStatus !== "all" && item.status !== filterStatus) {
                return false;
            }

            // 3. Filter Date Range (So sánh theo receivedDate)
            if (filterFromDate) {
                const itemDate = new Date(item.receivedDate).setHours(0,0,0,0);
                const fromDate = new Date(filterFromDate).setHours(0,0,0,0);
                if (itemDate < fromDate) return false;
            }

            if (filterToDate) {
                const itemDate = new Date(item.receivedDate).setHours(0,0,0,0);
                const toDate = new Date(filterToDate).setHours(0,0,0,0);
                if (itemDate > toDate) return false;
            }

            return true;
        });
    }, [inboundNotes, searchTerm, filterStatus, filterFromDate, filterToDate]);

    // Hàm Reset Filters
    const resetFilters = () => {
        setSearchTerm("");
        setFilterStatus("all");
        setFilterFromDate("");
        setFilterToDate("");
    };

    // ... (Giữ nguyên logic Approve, Reject, Cancel cũ) ...
    const handleApprove = async (id: number) => {
        setProcessingId(id);
        try {
            await inboundService.approveInboundNote(id);
            toast({ title: "Thành công", description: "Đã duyệt phiếu thành công!" });
            await fetchInboundNotes();
        } catch (error: any) {
            toast({ title: "Thất bại", description: error.response?.data?.details || "Lỗi khi duyệt", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (id: number) => {
        setProcessingId(id);
        try {
            await inboundService.rejectInboundNote(id);
            toast({ title: "Thành công", description: "Đã từ chối phiếu." });
            await fetchInboundNotes();
        } catch (error: any) {
            toast({ title: "Thất bại", description: error.response?.data?.details || "Lỗi khi từ chối", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    const onCancel = async (id: number, onSuccess?: () => void) => {
        setProcessingId(id);
        try {
            await inboundService.cancelInbound(id);
            toast({ title: "Thành công", description: "Đã hủy phiếu nhập kho.", className: "bg-green-500 text-white" });
            await fetchInboundNotes();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({ title: "Lỗi", description: error.details || "Không thể hủy phiếu nhập.", variant: "destructive" });
        } finally {
            setProcessingId(null);
        }
    };

    return {
        inboundNotes: filteredNotes,
        loading,
        processingId,
        refresh: fetchInboundNotes,
        onApprove: handleApprove,
        onReject: handleReject,
        onCancel,
        // Filter exports
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters
    };
};