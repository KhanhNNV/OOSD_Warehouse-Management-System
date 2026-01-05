// src/hooks/usePutAwayScanner.ts
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { putawayService } from "@/services/putAway.service";
import { PutAwaySession } from "@/types/putAway";

export const usePutAwayScanner = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // State quản lý phiên làm việc hiện tại
    const [session, setSession] = useState<PutAwaySession>({
        step: 'SCAN_PRODUCT',
        product: null,
        quantity: 1,
        mfgDate: '',
        expDate: ''
    });

    // Reset về trạng thái ban đầu
    const resetSession = () => {
        setSession({
            step: 'SCAN_PRODUCT',
            product: null,
            quantity: 1,
            mfgDate: '',
            expDate: ''
        });
    };

    // Xử lý logic quét mã dựa trên Step hiện tại
    const handleScan = async (code: string) => {
        const cleanCode = code.trim();
        if (!cleanCode) return;

        setIsLoading(true);

        try {
            // BƯỚC 1: ĐANG CẦN QUÉT SẢN PHẨM
            if (session.step === 'SCAN_PRODUCT') {
                const product = await putawayService.getProductByBarcode(cleanCode);
                if (product) {
                    setSession(prev => ({
                        ...prev,
                        step: 'INPUT_DETAILS', // Chuyển sang bước nhập liệu
                        product: product
                    }));
                    toast({ title: "Đã chọn sản phẩm", description: product.productName || product.name });
                } else {
                    toast({ title: "Lỗi", description: "Không tìm thấy sản phẩm", variant: "destructive" });
                }
            }
            // BƯỚC 3: ĐANG CẦN QUÉT KỆ (BƯỚC 2 là nhập liệu bằng tay, không dùng scan)
            else if (session.step === 'SCAN_LOCATION') {
                const location = await putawayService.getLocationByCode(cleanCode);

                // Validate Location Type
                if (location && location.locationType === 'SHELF_STORAGE') {
                    // Tự động Submit luôn khi quét đúng kệ
                    await submitPutAwayFinal(cleanCode);
                } else if (location) {
                    toast({
                        title: "Sai loại vị trí",
                        description: `Vị trí này là ${location.locationType}, cần quét SHELF_STORAGE`,
                        variant: "destructive"
                    });
                } else {
                    toast({ title: "Lỗi", description: "Không tìm thấy vị trí", variant: "destructive" });
                }
            }
        } catch (e) {
            console.error(e);
            toast({ title: "Lỗi hệ thống", description: "Đã xảy ra lỗi khi xử lý", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm gọi API cuối cùng
    const submitPutAwayFinal = async (shelfCode: string) => {
        if (!session.product) return;

        try {
            setIsLoading(true);
            await putawayService.submitPutAway({
                productId: session.product.productId,
                quantity: session.quantity,
                targetShelfCode: shelfCode,
                manufactureDate: session.mfgDate || undefined, // Gửi undefined nếu rỗng để backend xử lý
                expiryDate: session.expDate || undefined
            });

            toast({
                title: "Thành công!",
                description: `Đã cất ${session.quantity} ${session.product.productName} vào ${shelfCode}`,
                className: "bg-green-600 text-white border-none"
            });

            resetSession(); // Quay về quét sản phẩm tiếp theo

        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi khi cất hàng";
            toast({ title: "Thất bại", description: msg, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    // Hàm xác nhận bước nhập liệu (Step 2 -> Step 3)
    const confirmDetails = (qty: number, mfg: string, exp: string) => {
        if (qty <= 0) {
            toast({ title: "Lỗi", description: "Số lượng phải lớn hơn 0", variant: "destructive" });
            return;
        }
        setSession(prev => ({
            ...prev,
            quantity: qty,
            mfgDate: mfg,
            expDate: exp,
            step: 'SCAN_LOCATION' // Chuyển sang bước quét kệ
        }));
    };

    return {
        session,
        isLoading,
        setSession,
        handleScan,
        confirmDetails,
        resetSession
    };
};