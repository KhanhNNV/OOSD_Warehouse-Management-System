import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { inboundService } from "@/services/inbound.service";
import { productService } from "@/services/product.service";
import { ScannedItem, WorkingSession, ConfirmState } from "@/types/inboundScanning";
import { InboundSubmitItem } from "@/types/inbound"; // Import type đã sửa ở bước trước

const STORAGE_KEY = "INBOUND_SCAN_DATA_PERSISTENT";

export const useInboundScanning = (poId: string | null) => {
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE ---
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [manualCode, setManualCode] = useState("");

    // State Modal nhập liệu/báo cáo
    const [session, setSession] = useState<WorkingSession>({ mode: null });

    // State Modal tạm (Input fields)
    const [tempQty, setTempQty] = useState<string>("");
    const [tempReason, setTempReason] = useState<string>("");
    const [tempNote, setTempNote] = useState<string>("");

    // State Modal Xác nhận (Confirm Dialog)
    const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
        isOpen: false, title: "", message: "", type: 'info', onConfirm: () => {}
    });

    // State lỗi từ Backend
    const [errorItems, setErrorItems] = useState<any[]>([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    const isLoaded = useRef(false);

    // --- EFFECTS ---

    // 1. Init Session (Tạo phiếu Draft)


    // 2. Load LocalStorage
    useEffect(() => {
        const checkOldData = () => {
            try {
                const savedJson = localStorage.getItem(STORAGE_KEY);
                if (savedJson) {
                    const parsedData = JSON.parse(savedJson);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        setTimeout(() => {
                            setConfirmDialog({
                                isOpen: true,
                                title: "Phát hiện dữ liệu cũ",
                                message: `Bạn có ${parsedData.length} sản phẩm đang nhập dở từ lần trước. Bạn muốn khôi phục không?`,
                                type: 'info',
                                onConfirm: () => {
                                    setScannedItems(parsedData);
                                    toast({ title: "Khôi phục thành công", description: "Đã tải lại phiên làm việc trước đó." });
                                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                                }
                            });
                            isLoaded.current = true;
                        }, 100);
                    } else isLoaded.current = true;
                } else isLoaded.current = true;
            } catch (e) { isLoaded.current = true; }
        };
        checkOldData();
    }, []);

    // 3. Save LocalStorage
    useEffect(() => {
        if (isLoaded.current || scannedItems.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedItems));
        }
    }, [scannedItems]);

    // --- ACTIONS ---

    const handleScanResult = async (code: string) => {
        if (!code) return;
        setIsLoading(true);
        try {
            const product = await productService.getProductByBarcode(code);
            if (product) {
                setTempQty("");
                // Lưu ý: product trả về cần có id/productId thống nhất. Giả sử product có 'productId'
                setSession({
                    mode: 'ADD',
                    item: { ...product, productId: Number(product.productId), inputQty: 0 } as any
                });
                toast({ title: "Đã tìm thấy", description: `Sản phẩm: ${product.productName}` });
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Lỗi tìm kiếm", description: "Không tìm thấy sản phẩm với mã vạch này." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSearch = () => {
        if (!manualCode.trim()) {
            toast({ title: "Thiếu thông tin", description: "Vui lòng nhập mã vạch để tìm kiếm." });
            return;
        }
        handleScanResult(manualCode);
        setManualCode("");
    };

    const openEdit = (index: number) => {
        setTempQty(scannedItems[index].inputQty.toString());
        setSession({ mode: 'EDIT', item: scannedItems[index], index });
    };

    const openReportItem = (index: number) => {
        setTempReason(scannedItems[index].reportReason || "");
        setTempNote(scannedItems[index].note || "");
        setSession({ mode: 'REPORT_ITEM', item: scannedItems[index], index });
    };

    const openReportInvoice = () => {
        setTempReason("");
        setTempNote("");
        setSession({ mode: 'REPORT_INVOICE' });
    };

    const handleSave = () => {
        const list = [...scannedItems];

        switch (session.mode) {
            case 'ADD':{
                if (!session.item) return;
                const addQty = parseInt(tempQty);
                if (isNaN(addQty) || addQty <= 0) {
                    toast({ variant: "destructive", title: "Lỗi", description: "Số lượng phải lớn hơn 0" });
                    return;
                }
                const existIdx = list.findIndex(i => i.barcode === session.item!.barcode);
                if (existIdx >= 0) {
                    list[existIdx].inputQty += addQty;
                    toast({ title: "Đã cập nhật", description: `Đã cộng thêm +${addQty} vào danh sách.` });
                } else {
                    list.push({ ...session.item, inputQty: addQty });
                    toast({ title: "Thành công", description: "Đã thêm sản phẩm mới vào danh sách." });
                }
                setScannedItems(list);
                break;
            }
            case 'EDIT':{
                if (session.index === undefined) return;
                const editQty = parseInt(tempQty);
                if (isNaN(editQty) || editQty <= 0) {
                    toast({ variant: "destructive", title: "Lỗi", description: "Số lượng phải lớn hơn 0" });
                    return;
                }
                list[session.index].inputQty = editQty;
                setScannedItems(list);
                toast({ title: "Đã cập nhật", description: "Số lượng đã được thay đổi." });
                break;
            }
            case 'REPORT_ITEM':
                if (session.index === undefined) return;
                list[session.index].reportReason = tempReason;
                list[session.index].note = tempNote;
                setScannedItems(list);
                toast({ title: "Ghi chú", description: "Đã gán lỗi cho sản phẩm này." });
                break;
            case 'REPORT_INVOICE':
                // Logic báo cáo hóa đơn (nếu cần gọi API riêng thì làm ở đây)
                console.log("Report Invoice:", { reason: tempReason, note: tempNote });
                toast({ variant: "destructive", title: "Đã gửi", description: "Báo cáo hóa đơn đã được ghi nhận." });
                break;
        }
        setSession({ mode: null });
    };

    const handleClearItemReport = () => {
        if (session.mode === 'REPORT_ITEM' && session.index !== undefined) {
            const list = [...scannedItems];
            delete list[session.index].reportReason;
            delete list[session.index].note;
            setScannedItems(list);
            setSession({ mode: null });
            toast({ title: "Đã gỡ bỏ", description: "Đã xóa báo cáo lỗi cho sản phẩm này." });
        }
    };

    const handleConfirmDeleteAll = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Xóa tất cả?",
            message: "Bạn có chắc muốn xóa toàn bộ danh sách đã quét? Hành động này không thể hoàn tác.",
            type: 'danger',
            onConfirm: () => {
                setScannedItems([]);
                localStorage.removeItem(STORAGE_KEY);
                toast({ title: "Đã xóa", description: "Danh sách quét đã được làm trống." });
                setConfirmDialog(prev => ({...prev, isOpen: false}));
            }
        });
    };

    const handleConfirmComplete = () => {
        if (scannedItems.length === 0) return;
        if (!poId) {
            toast({ variant: "destructive", title: "Lỗi dữ liệu", description: "Không tìm thấy mã đơn hàng (PO ID)!" });
            return;
        }

        setConfirmDialog({
            isOpen: true,
            title: "Xác nhận nhập kho",
            message: `Bạn đang gửi ${scannedItems.length} mã sản phẩm lên hệ thống. Hãy chắc chắn thông tin đã chính xác.`,
            type: 'success',
            onConfirm: async () => {
                try {
                    // 1. Format dữ liệu chuẩn (InboundSubmitItem[])
                    const payload: InboundSubmitItem[] = scannedItems.map(item => ({
                        productId: Number(item.productId), // hoặc item.id tuỳ vào object product trả về
                        actualQty: Number(item.inputQty)
                    }));

                    // 2. Gọi API
                    await inboundService.submitInbound(poId, payload);

                    // 3. Success
                    setScannedItems([]);
                    localStorage.removeItem(STORAGE_KEY);
                    toast({
                        title: "Thành công!",
                        description: "Nhập kho hoàn tất. Đang chuyển hướng...",
                        className: "bg-green-600 text-white border-green-600"
                    });
                    setConfirmDialog(prev => ({...prev, isOpen: false}));

                    setTimeout(() => navigate("/staff/inboundNote"), 1000);

                } catch (error: any) {
                    console.error("Lỗi gửi hàng:", error);
                    const res = error.response?.data;

                    if (res) {
                        // Trường hợp A: Có danh sách chi tiết lỗi từ validation BE
                        if (res.details && Array.isArray(res.details) && res.details.length > 0) {
                            setErrorItems(res.details);
                            setIsErrorModalOpen(true);
                        } else {
                            toast({ variant: "destructive", title: "Nhập kho thất bại", description: res.message || "Dữ liệu không hợp lệ." });
                        }
                    } else {
                        toast({ variant: "destructive", title: "Lỗi hệ thống", description: "Không thể kết nối đến server." });
                    }
                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                }
            }
        });
    };

    // Return tất cả state và handler cần thiết cho View
    return {
        // State
        scannedItems, setScannedItems,
        isLoading,
        manualCode, setManualCode,
        session, setSession,
        confirmDialog, setConfirmDialog,
        errorItems, isErrorModalOpen, setIsErrorModalOpen,
        tempQty, setTempQty,
        tempReason, setTempReason,
        tempNote, setTempNote,

        // Handlers
        handleScanResult,
        handleManualSearch,
        handleSave,
        handleClearItemReport,
        handleConfirmDeleteAll,
        handleConfirmComplete,
        openEdit,
        openReportItem,
        openReportInvoice
    };
};