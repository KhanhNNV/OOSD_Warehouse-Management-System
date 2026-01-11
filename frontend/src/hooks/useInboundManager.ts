// src/hooks/useInboundManager.ts
import {useState, useEffect, useCallback, useMemo} from 'react';
import { inboundService } from '@/services/inbound.service';
import { InboundNoteResponse } from '@/types/inbound';
import { toast } from "@/hooks/use-toast";

export const useInboundManager = () => {
    const [inboundNotes, setInboundNotes] = useState<InboundNoteResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState("");

    // Hàm lấy danh sách phiếu
    const fetchInboundNotes = useCallback(async () => {
        setLoading(true);
        try {
            const data = await inboundService.getAllInboundNotes();
            // Sắp xếp theo ngày mới nhất (tuỳ chọn)
            const sortedData = data.sort((a, b) =>
                new Date(b.receivedDate).getTime() - new Date(a.receivedDate).getTime()
            );
            setInboundNotes(sortedData);
        } catch (error) {
            const res = error.response?.data;
            console.error(error);
            toast({
                title: "Không thể tải danh sách phiếu nhập.",
                description: res.details,
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

    const filteredNotes = useMemo(() => {
        if (!searchTerm) return inboundNotes;
        const lowerTerm = searchTerm.toLowerCase();
        return inboundNotes.filter((item) =>
            item.noteNumber.toLowerCase().includes(lowerTerm) ||
            item.poNumber.toLowerCase().includes(lowerTerm) ||
            item.processedBy?.toLowerCase().includes(lowerTerm)
        );
    }, [inboundNotes, searchTerm]);

    // Hàm duyệt
    const handleApprove = async (id: number) => {
        setProcessingId(id);
        try {
            await inboundService.approveInboundNote(id);
            toast({
                title: "Thành công",
                description: "Đã duyệt phiếu #${id} thành công!"
            });
            await fetchInboundNotes(); // Reload lại danh sách
        } catch (error) {
            const res = error.response?.data;
            console.error(error);
            toast({
                title: "Duyệt phiếu thất bại.",
                description: res.details,
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    // Hàm từ chối
    const handleReject = async (id: number) => {
        setProcessingId(id);
        try {
            await inboundService.rejectInboundNote(id);
            toast({
                title: "Thành công",
                description: "Đã từ chối phiếu #${id}."
            });
            await fetchInboundNotes(); // Reload lại danh sách
        } catch (error) {
            const res = error.response?.data;
            console.error(error);
            toast({
                title: "Từ chối phiếu thất bại.",
                description: res.details,
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    const onCancel = async (id: number, onSuccess?: () => void) => {
        setProcessingId(id);
        try {
            await inboundService.cancelInbound(id);

            toast({
                title: "Thành công",
                description: "Đã hủy phiếu nhập kho.",
                className: "bg-green-500 text-white"
            });

            await fetchInboundNotes();
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.details || "Không thể hủy phiếu nhập.",
                variant: "destructive",
            });
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
        searchTerm,
        setSearchTerm,
        onCancel
    };
};