// src/hooks/useRelocateScanning.ts
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import { inventoryService } from "@/services/relocate.service.ts";
import { RelocatedItemLog } from "@/types/relocate.ts";
import {toastError} from "@/components/common/toastError.tsx";

type Step = 'SCAN_FROM' | 'SCAN_TO' | 'SCAN_PRODUCT';

export function useRelocateScanning() {
    const { toast } = useToast();

    // --- STATE DỮ LIỆU ---
    const [fromLoc, setFromLoc] = useState<string>("");
    const [toLoc, setToLoc] = useState<string>("");
    const [barcode, setBarcode] = useState<string>("");
    const [quantity, setQuantity] = useState<string>(""); // Dùng string để input dễ handle

    // --- STATE UI ---
    const [isLoading, setIsLoading] = useState(false);
    const [activeStep, setActiveStep] = useState<Step>('SCAN_FROM');
    const [isQtyModalOpen, setIsQtyModalOpen] = useState(false);

    // --- HISTORY LOG ---
    const [history, setHistory] = useState<RelocatedItemLog[]>([]);

    // Xử lý khi quét Camera hoặc Nhập tay Enter
    const handleScan = (code: string) => {
        if (!code) return;

        if (activeStep === 'SCAN_FROM') {
            setFromLoc(code.toUpperCase());
            setActiveStep('SCAN_TO');
            toast({ title: "Đã chọn vị trí nguồn", description: code });
            return;
        }

        if (activeStep === 'SCAN_TO') {
            if (code.toUpperCase() === fromLoc) {
                toast({ variant: "destructive", title: "Lỗi", description: "Vị trí đích không được trùng vị trí nguồn!" });
                return;
            }
            setToLoc(code.toUpperCase());
            setActiveStep('SCAN_PRODUCT');
            toast({ title: "Đã chọn vị trí đích", description: code });
            return;
        }

        if (activeStep === 'SCAN_PRODUCT') {
            setBarcode(code);
            setQuantity("1"); // Default số lượng
            setIsQtyModalOpen(true); // Mở modal nhập số lượng
        }
    };

    // Gọi API Relocate
    const handleSubmitRelocate = async () => {
        const qtyInt = parseInt(quantity);
        if (!qtyInt || qtyInt <= 0) {
            toast({ variant: "destructive", title: "Lỗi", description: "Số lượng không hợp lệ" });
            return;
        }

        setIsLoading(true);
        try {
            await inventoryService.relocateItem({
                barcode: barcode,
                fromLocationCode: fromLoc,
                toLocationCode: toLoc,
                quantity: qtyInt
            });

            // Ghi log thành công
            const newLog: RelocatedItemLog = {
                id: Date.now().toString(),
                barcode,
                from: fromLoc,
                to: toLoc,
                quantity: qtyInt,
                status: 'SUCCESS',
                timestamp: new Date()
            };
            setHistory(prev => [newLog, ...prev]);

            toast({ title: "Thành công", description: `Đã chuyển ${qtyInt} sp từ ${fromLoc} sang ${toLoc}`, className: "bg-green-50 border-green-200" });

            // Reset để quét món tiếp theo (giữ lại location để tiện quét tiếp)
            setIsQtyModalOpen(false);
            setBarcode("");
            setQuantity("");
            // Vẫn giữ ở bước SCAN_PRODUCT để nhân viên bắn tiếp món khác cùng kho
        } catch (error: any) {
            toastError(error)
        } finally {
            setIsLoading(false);
        }
    };

    const resetProcess = () => {
        setFromLoc("");
        setToLoc("");
        setBarcode("");
        setActiveStep('SCAN_FROM');
        setHistory([]);
    };

    return {
        // Data
        fromLoc, setFromLoc,
        toLoc, setToLoc,
        quantity, setQuantity,
        barcode,
        history,

        // UI State
        activeStep, setActiveStep,
        isQtyModalOpen, setIsQtyModalOpen,
        isLoading,

        // Actions
        handleScan,
        handleSubmitRelocate,
        resetProcess
    };
}