// import { useState, useEffect, useCallback } from "react";
// import { useToast } from "@/components/ui/use-toast"; // Đảm bảo import đúng đường dẫn
// import { putawayService } from "@/services/putAway.service";
// import { PutAwaySession, TransitItem } from "@/types/putAway";

// export const usePutAwayScanner = () => {
//     const { toast } = useToast();
//     const [isLoading, setIsLoading] = useState(false);

//     // --- DATA STATES ---
//     const [transitList, setTransitList] = useState<TransitItem[]>([]);
//     const [suggestedShelves, setSuggestedShelves] = useState<string[]>([]);
//     const [scannedShelf, setScannedShelf] = useState<string>(""); // Lưu kệ hiện tại

//     // --- SESSION STATE ---
//     const [session, setSession] = useState<PutAwaySession>({
//         step: 'SCAN_PRODUCT',
//         selectedItem: null,
//         inputQuantity: 1, // (Có thể giữ hoặc bỏ tùy logic UI, ta dùng formData bên component)
//         expDate: ''
//     });

//     // --- 1. FETCH DATA (Transit & Shelves) ---
//     const fetchData = useCallback(async () => {
//         setIsLoading(true);
//         try {
//             const [transitData, shelvesData] = await Promise.all([
//                 putawayService.getTransitInventory(),
//                 putawayService.getAvailableShelves()
//             ]);
//             setTransitList(transitData || []);
//             setSuggestedShelves(shelvesData || []);
//         } catch (error) {
//             console.error(error);
//             toast({ variant: "destructive", title: "Lỗi tải dữ liệu", description: "Không thể lấy danh sách hàng hoặc kệ." });
//         } finally {
//             setIsLoading(false);
//         }
//     }, [toast]);

//     useEffect(() => {
//         fetchData();
//     }, [fetchData]);

//     const resetSession = () => {
//         setSession({
//             step: 'SCAN_PRODUCT',
//             selectedItem: null,
//             inputQuantity: 1,
//             expDate: ''
//         });
//         setScannedShelf("");
//         fetchData(); // Refresh data sau khi reset
//     };

//     // --- 2. LOGIC QUÉT MÃ (Product -> Shelf) ---
//     const handleScan = (code: string) => {
//         const cleanCode = code?.trim();
//         if (!cleanCode) return;

//         // BƯỚC 1: Quét Sản Phẩm
//         if (session.step === 'SCAN_PRODUCT') {
//             const foundItem = transitList.find(i => i.barcode === cleanCode || i.sku === cleanCode);

//             if (foundItem) {
//                 setSession(prev => ({
//                     ...prev,
//                     selectedItem: foundItem,
//                     step: 'SCAN_LOCATION' // Chuyển sang bước quét kệ
//                 }));
//                 setScannedShelf(""); // Reset kệ cũ nếu có
//                 toast({ description: `Đã chọn: ${foundItem.productName}`, className: "bg-blue-50 text-blue-900" });
//             } else {
//                 toast({ variant: "destructive", description: "Không tìm thấy sản phẩm trong danh sách đang giữ." });
//             }
//             return;
//         }

//         // BƯỚC 2: Quét Kệ
//         if (session.step === 'SCAN_LOCATION') {
//             // Validate: Kệ có trong danh sách gợi ý không?
//             if (suggestedShelves.includes(cleanCode)) {
//                 setScannedShelf(cleanCode);
//                 setSession(prev => ({ ...prev, step: 'INPUT_DETAILS' })); // Chuyển sang nhập liệu
//                 toast({ className: "text-green-600 bg-green-50", description: `Vị trí hợp lệ: ${cleanCode}` });
//             } else {
//                 toast({
//                     variant: "destructive",
//                     title: "Sai vị trí",
//                     description: `Kệ ${cleanCode} không nằm trong danh sách cho phép!`
//                 });
//             }
//             return;
//         }
//     };

//     // --- 3. SUBMIT (Gửi API) ---
//     const submitPutAway = async (qty: number, exp: string) => {
//         if (!session.selectedItem || !scannedShelf) return false;

//         setIsLoading(true);
//         try {
//             await putawayService.submitPutAway({
//                 productId: session.selectedItem.productId,
//                 quantity: qty,
//                 targetShelfCode: scannedShelf,
//                 expiryDate: exp || undefined
//             });

//             toast({
//                 title: "Thành công!",
//                 description: `Đã cất ${qty} sản phẩm vào kệ ${scannedShelf}`,
//                 className: "bg-green-600 text-white border-none"
//             });

//             resetSession(); // Reset để làm phiếu mới
//             return true; // Trả về true để component biết mà clear form
//         } catch (error: any) {
//             const msg = error.response?.data?.message || "Lỗi khi cất hàng";
//             toast({ variant: "destructive", title: "Thất bại", description: msg });
//             return false;
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return {
//         // State
//         session,
//         transitList,
//         suggestedShelves,
//         scannedShelf,
//         isLoading,

//         // Actions
//         setSession, // Vẫn expose nếu component cần custom gì đó đặc biệt
//         handleScan,
//         submitPutAway,
//         resetSession,
//         refreshData: fetchData
//     };
// };




import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { putawayService } from "@/services/putAway.service";
import { PutAwaySession, TransitItem } from "@/types/putAway";

export const usePutAwayScanner = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // --- DATA STATES ---
  const [transitList, setTransitList] = useState<TransitItem[]>([]);

  // State này sẽ chứa vị trí được gợi ý từ Backend
  const [suggestedShelves, setSuggestedShelves] = useState<string[]>([]);
  const [scannedShelf, setScannedShelf] = useState<string>("");

  // --- SESSION STATE ---
  const [session, setSession] = useState<PutAwaySession>({
    step: "SCAN_PRODUCT",
    selectedItem: null,
    inputQuantity: 1,
    expDate: "",
  });

  // --- 1. FETCH DATA (Chỉ lấy Transit list lúc đầu) ---
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Chỉ cần lấy danh sách hàng cần cất, không cần lấy toàn bộ kệ trống nữa
      const transitData = await putawayService.getTransitInventory();
      setTransitList(transitData || []);
      setSuggestedShelves([]); // Reset gợi ý
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

  const resetSession = () => {
    setSession({
      step: "SCAN_PRODUCT",
      selectedItem: null,
      inputQuantity: 1,
      expDate: "",
    });
    setScannedShelf("");
    setSuggestedShelves([]); // Clear gợi ý cũ
    fetchData();
  };

  // --- 2. LOGIC QUÉT MÃ ---
  const handleScan = async (code: string) => {
    const cleanCode = code?.trim();
    if (!cleanCode) return;

    // === BƯỚC 1: QUÉT SẢN PHẨM ===
    if (session.step === "SCAN_PRODUCT") {
      const foundItem = transitList.find(
        (i) => i.barcode === cleanCode || i.sku === cleanCode
      );

      if (foundItem) {
        setIsLoading(true); // Bật loading khi đang xin gợi ý
        try {
          // 1. Gọi API lấy gợi ý (Waterfall Logic)
          // Lưu ý: foundItem phải có trường sku, nếu không có thì fallback dùng barcode hoặc xử lý lỗi
          const skuToSend = foundItem.sku || foundItem.barcode;
          const suggestion = await putawayService.getSuggestedLocation(
            skuToSend
          );

          // 2. Cập nhật state
          setSuggestedShelves(suggestion ? [suggestion] : []);

          setSession((prev) => ({
            ...prev,
            selectedItem: foundItem,
            step: "SCAN_LOCATION",
          }));
          setScannedShelf("");

          toast({
            description: `Đã chọn: ${foundItem.productName}. Vị trí gợi ý: ${
              suggestion || "Không có"
            }`,
            className: "bg-blue-50 text-blue-900 border-blue-200",
          });
        } catch (error) {
          console.error("Lỗi lấy gợi ý:", error);
          toast({
            title: "Không có gợi ý",
            description:
              "Hệ thống không tìm thấy vị trí phù hợp, vui lòng chọn thủ công.",
          });
          // Vẫn cho phép đi tiếp nhưng không có gợi ý (nhân viên tự quét kệ bất kỳ)
          setSuggestedShelves([]); // Hoặc load lại danh sách tất cả kệ trống nếu muốn
          setSession((prev) => ({
            ...prev,
            selectedItem: foundItem,
            step: "SCAN_LOCATION",
          }));
        } finally {
          setIsLoading(false);
        }
      } else {
        toast({
          variant: "destructive",
          description: "Không tìm thấy sản phẩm trong danh sách.",
        });
      }
      return;
    }

    // === BƯỚC 2: QUÉT KỆ ===
    if (session.step === "SCAN_LOCATION") {
      // Logic Validate:
      // Nếu CÓ gợi ý -> Cảnh báo nếu quét sai, nhưng vẫn cho phép (soft warning) hoặc chặn (hard block).
      // Ở đây ta dùng Soft Warning: Nếu khác gợi ý thì hỏi lại hoặc cho qua.
      // Để đơn giản: Nếu gợi ý có dữ liệu, ta ưu tiên check.

      const isMatchSuggestion = suggestedShelves.includes(cleanCode);

      if (suggestedShelves.length > 0 && !isMatchSuggestion) {
        // Logic mở rộng: Có thể cho phép override nếu kệ quét được là kệ trống hợp lệ khác.
        // Nhưng để tuân thủ quy trình Waterfall, ta sẽ cảnh báo mạnh.
        toast({
          variant: "destructive", // Hoặc warning
          title: "Khác vị trí gợi ý!",
          description: `Hệ thống đề xuất: ${suggestedShelves[0]}. Bạn vừa quét: ${cleanCode}`,
        });
        // Nếu muốn chặn tuyệt đối: return;
        // Nếu muốn cho phép (sau khi nhân viên xác nhận kệ trống thực tế):
        // setScannedShelf(cleanCode); setSession(...INPUT_DETAILS);

        // Tạm thời Code này cho phép đi tiếp để linh hoạt, nhưng báo toast đỏ
      }

      setScannedShelf(cleanCode);
      setSession((prev) => ({ ...prev, step: "INPUT_DETAILS" }));
      toast({
        className: "text-green-600 bg-green-50",
        description: `Đã xác nhận vị trí: ${cleanCode}`,
      });

      return;
    }
  };

  // --- 3. SUBMIT ---
  const submitPutAway = async (qty: number, exp: string) => {
    if (!session.selectedItem || !scannedShelf) return false;

    setIsLoading(true);
    try {
      await putawayService.submitPutAway({
        productId: session.selectedItem.productId,
        quantity: qty,
        targetShelfCode: scannedShelf,
        expiryDate: exp || undefined,
      });

      toast({
        title: "Thành công!",
        description: `Đã cất ${qty} SP vào ${scannedShelf}`,
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
    session,
    setSession,
    transitList,
    suggestedShelves,
    scannedShelf,
    isLoading,
    handleScan,
    submitPutAway,
    resetSession,
    refreshData: fetchData,
  };
};
