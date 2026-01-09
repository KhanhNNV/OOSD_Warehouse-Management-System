import { useState, useEffect } from 'react';
import { InboundNoteResponse } from '../types/inbound';
import { inboundService } from '../services/inbound.service';
import { handleErrorApi } from "@/hooks/error-helper.ts";
import {useNavigate} from "react-router-dom";

export const useMyInboundNotes = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<InboundNoteResponse[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [isCreating, setIsCreating] = useState(false);

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

    // Gọi API khi component mount
    useEffect(() => {
        fetchMyNotes();
    }, []);

    // Trả về data và hàm refetch (để nút reload gọi lại)
    return { data, loading, error, refetch: fetchMyNotes, handleStartCheck, isCreating };
};