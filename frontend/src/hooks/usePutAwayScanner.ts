// src/hooks/usePutAwayScanner.ts

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { putawayService } from "@/services/putAway.service";
import { PutAwaySession, TransitItem } from "@/types/putAway";

const STORAGE_REF_ID = "LATEST_PNP_REF_ID";

export const usePutAwayScanner = () => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);

    // --- DATA STATES ---
    const [transitList, setTransitList] = useState<TransitItem[]>([]);
    // Lưu vị trí kệ được gợi ý từ API (VD: "A-01-01")
    const [suggestedLocation, setSuggestedLocation] = useState<string>("");
    // Lưu vị trí kệ người dùng thực tế đã quét
    const [scannedShelf, setScannedShelf] = useState<string>("");

    // --- SESSION STATE ---
    const [session, setSession] = useState<PutAwaySession>({
        step: "SCAN_PRODUCT",
        selectedItem: null,
        inputQuantity: 1,
        expDate: "",
    });

    // --- FETCH DATA (Chỉ lấy Transit List - Hàng chờ cất) ---
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // Chỉ cần lấy danh sách hàng đang chờ
            const transitData = await putawayService.getTransitInventory();
            setTransitList(transitData || []);
        } catch (error) {
            console.error(error);
            toast({
                variant: "destructive",
                title: "Lỗi tải dữ liệu",
                description: "Không thể lấy danh sách hàng chờ cất.",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset lại phiên làm việc
    const resetSession = () => {
        setSession({
            step: "SCAN_PRODUCT",
            selectedItem: null,
            inputQuantity: 1,
            expDate: "",
        });
        setScannedShelf("");
        setSuggestedLocation(""); // Reset gợi ý
        fetchData(); // Refresh lại danh sách hàng chờ
    };

    // --- LOGIC QUÉT MÃ (Product -> Get Suggestion -> Scan Shelf) ---
    const handleScan = async (code: string) => {
        const cleanCode = code?.trim();
        if (!cleanCode) return;

        // === Quét Sản Phẩm ===
        if (session.step === "SCAN_PRODUCT") {
            const foundItem = transitList.find(
                (i) => i.barcode === cleanCode || i.sku === cleanCode
            );

            if (foundItem) {
                setIsLoading(true);
                try {
                    // Gọi API lấy gợi ý vị trí (VD: Backend trả về "A-1-2")
                    const location = await putawayService.getSuggestedLocation(foundItem.sku);

                    // Cập nhật state
                    setSuggestedLocation(location);

                    // Chuyển sang bước quét kệ
                    setSession((prev) => ({
                        ...prev,
                        selectedItem: foundItem,
                        step: "SCAN_LOCATION",
                    }));
                    setScannedShelf(""); // Reset kệ đã quét (đề phòng lưu vết cũ)

                    toast({
                        title: "Đã tìm thấy vị trí!",
                        description: `Vui lòng cất hàng vào: ${location}`,
                        className: "bg-blue-50 text-blue-900 border-blue-200",
                    });

                } catch (error: any) {
                    console.error("Lỗi lấy gợi ý:", error);
                    const msg = error.response?.data?.message || "Không tìm được vị trí phù hợp trong kho.";

                    toast({
                        variant: "destructive",
                        title: "Không thể gợi ý vị trí",
                        description: msg,
                    });
                    // Lưu ý: Có thể giữ user ở lại bước SCAN_PRODUCT để họ thử sản phẩm khác
                } finally {
                    setIsLoading(false);
                }
            } else {
                toast({
                    variant: "destructive",
                    description: "Không tìm thấy sản phẩm này trong danh sách hàng chờ.",
                });
            }
            return;
        }

        // === Quét Kệ (Xác thực với gợi ý) ===
        if (session.step === "SCAN_LOCATION") {
            // So sánh mã quét được với mã gợi ý (Case-insensitive cho an toàn)
            if (cleanCode.toUpperCase() === suggestedLocation.toUpperCase()) {
                setScannedShelf(cleanCode);
                setSession((prev) => ({ ...prev, step: "INPUT_DETAILS" }));

                toast({
                    className: "text-green-600 bg-green-50",
                    description: `Chính xác! Đang nhập thông tin cho kệ ${cleanCode}`,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Sai vị trí",
                    description: `Hệ thống yêu cầu vị trí: ${suggestedLocation}. Bạn đang quét: ${cleanCode}`,
                });
            }
            return;
        }
    };

    // --- SUBMIT (Gửi API Cất Hàng) ---
    const submitPutAway = async (
        qty: number,
        exp: string,
        markLocationFull: boolean = false
    ) => {
        if (!session.selectedItem || !scannedShelf) return false;

        setIsLoading(true);
        const savedRefId = localStorage.getItem(STORAGE_REF_ID) || undefined;

        try {
            await putawayService.submitPutAway({
                productId: session.selectedItem.productId,
                quantity: qty,
                targetShelfCode: scannedShelf,
                expiryDate: exp || undefined,
                markLocationFull: markLocationFull,
                referenceDocId: savedRefId,
            });

            toast({
                title: "Thành công!",
                description: markLocationFull
                    ? `Đã cất ${qty} sản phẩm và đánh dấu kệ ${scannedShelf} đầy.`
                    : `Đã cất ${qty} sản phẩm vào kệ ${scannedShelf}.`,
                className: "bg-green-600 text-white border-none",
            });

            resetSession();
            return true;
        } catch (error: any) {
            const msg = error.response?.data?.details || "Lỗi khi cất hàng";
            toast({
                variant: "destructive",
                title: "Thất bại",
                description: msg
            });
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    return {
        // State
        session,
        transitList,
        suggestedLocation,
        scannedShelf,
        isLoading,

        // Actions
        setSession,
        handleScan,
        submitPutAway,
        resetSession,
        refreshData: fetchData,
    };
};