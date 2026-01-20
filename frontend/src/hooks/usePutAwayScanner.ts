// src/hooks/usePutAwayScanner.ts

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { putawayService } from "@/services/putAway.service";
import { PutAwaySession, TransitItem } from "@/types/putAway";

export const usePutAwayScanner = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- DATA STATES ---
  const [transitList, setTransitList] = useState<TransitItem[]>([]);
  const [suggestedShelves, setSuggestedShelves] = useState<string[]>([]);
  const [scannedShelf, setScannedShelf] = useState<string>("");

  // --- SESSION STATE ---
  const [session, setSession] = useState<PutAwaySession>({
    step: "SCAN_PRODUCT",
    selectedItem: null,
    inputQuantity: 1,
    expDate: "",
  });

  // --- 1. FETCH DATA (Transit & Shelves) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transitData, shelvesData] = await Promise.all([
        putawayService.getTransitInventory(),
        putawayService.getAvailableShelves(),
      ]);
      setTransitList(transitData || []);
      setSuggestedShelves(shelvesData || []);
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách hàng hoặc kệ.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetSession = () => {
    setSession({
      step: "SCAN_PRODUCT",
      selectedItem: null,
      inputQuantity: 1,
      expDate: "",
    });
    setScannedShelf("");
    fetchData(); // Refresh data sau khi reset
  };

  // --- 2. LOGIC QUÉT MÃ (Product -> Shelf) ---
  const handleScan = (code: string) => {
    const cleanCode = code?.trim();
    if (!cleanCode) return;

    // BƯỚC 1: Quét Sản Phẩm
    if (session.step === "SCAN_PRODUCT") {
      const foundItem = transitList.find(
        (i) => i.barcode === cleanCode || i.sku === cleanCode,
      );

      if (foundItem) {
        setSession((prev) => ({
          ...prev,
          selectedItem: foundItem,
          step: "SCAN_LOCATION",
        }));
        setScannedShelf("");
        toast({
          description: `Đã chọn: ${foundItem.productName}`,
          className: "bg-blue-50 text-blue-900",
        });
      } else {
        toast({
          variant: "destructive",
          description: "Không tìm thấy sản phẩm trong danh sách đang giữ.",
        });
      }
      return;
    }

    // BƯỚC 2: Quét Kệ
    if (session.step === "SCAN_LOCATION") {
      // Validate: Kệ có trong danh sách gợi ý không?
      if (suggestedShelves.includes(cleanCode)) {
        setScannedShelf(cleanCode);
        setSession((prev) => ({ ...prev, step: "INPUT_DETAILS" }));
        toast({
          className: "text-green-600 bg-green-50",
          description: `Vị trí hợp lệ: ${cleanCode}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Sai vị trí",
          description: `Kệ ${cleanCode} không nằm trong danh sách cho phép!`,
        });
      }
      return;
    }
  };

  // ✅ 3. SUBMIT (Gửi API) - UPDATE với markLocationFull parameter
  const submitPutAway = async (
    qty: number,
    exp: string,
    markLocationFull: boolean = false, // ✅ NEW parameter
  ) => {
    if (!session.selectedItem || !scannedShelf) return false;

    setIsLoading(true);
    try {
      await putawayService.submitPutAway({
        productId: session.selectedItem.productId,
        quantity: qty,
        targetShelfCode: scannedShelf,
        expiryDate: exp || undefined,
        markLocationFull: markLocationFull, // ✅ Gửi field này
      });

      toast({
        title: "Thành công!",
        description: markLocationFull
          ? `Đã cất ${qty} sản phẩm và đánh dấu kệ ${scannedShelf} đầy`
          : `Đã cất ${qty} sản phẩm vào ${scannedShelf}`,
        className: "bg-green-600 text-white border-none",
      });

      resetSession();
      return true;
    } catch (error: any) {
      const msg = error.response?.data?.message || "Lỗi khi cất hàng";
      toast({ variant: "destructive", title: "Thất bại", description: msg });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    // State
    session,
    transitList,
    suggestedShelves,
    scannedShelf,
    isLoading,

    // Actions
    setSession,
    handleScan,
    submitPutAway, // ✅ Đã update signature
    resetSession,
    refreshData: fetchData,
  };
};
