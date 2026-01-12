import { useState, useEffect } from 'react';
import { InboundNoteResponse } from '../types/inbound';
import { inboundService } from '../services/inbound.service';
import { handleErrorApi } from "@/hooks/error-helper.ts";
import {useNavigate} from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";

export const useMyInboundNotes = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<InboundNoteResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreating, setIsCreating] = useState(false);

    const [isCancelling, setIsCancelling] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");

    // Hàm fetch data
    const fetchMyNotes = async () => {
        setLoading(true);
        try {
            const result = await inboundService.getMyInboundNotes();
            setData(result);
            setError(null);
        } catch (err: any) {
            handleErrorApi(error, "Không thể tải danh sách phiếu nhập");
        } finally {
            setLoading(false);
        }
    };

    const handleStartCheck = async (poId: number | string) => {
        if (isCreating) return; // Chặn click đúp

        try {
            setIsCreating(true);
            navigate(`/staff/scanning?id=${poId}`);
        } catch (error: any) {
            setError("Lỗi tải dữ liệu");
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
                className: "bg-green-500 text-white"
            });

            // Refetch data sau khi hủy
            await fetchMyNotes();

            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error.details || "Không thể hủy phiếu này.",
                variant: "destructive",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    // Gọi API khi component mount
    useEffect(() => {
        fetchMyNotes();
    }, []);

    const filteredOrders = data.filter(
        (ib) =>
            ib.noteNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ib.poNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const {
        currentData,
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(filteredOrders, 5);

    // Trả về data và hàm refetch (để nút reload gọi lại)
    return { data: currentData, loading, error, refetch: fetchMyNotes, handleStartCheck, isCreating, cancelInboundNote, isCancelling,searchTerm,
        setSearchTerm,
        pagination: {
            currentPage,
            totalPages,
            onPageChange: goToPage,
            totalItems
        },};
};