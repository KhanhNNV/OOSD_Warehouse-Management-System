import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { inboundService } from "@/services/inbound.service";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2, Search, ArrowLeft, Save, Edit, X, Flag, AlertTriangle, FileWarning, RefreshCcw, AlertCircle, CheckCircle } from "lucide-react";
import { productService } from "@/services/product.service";
import { PurchaseOrder } from "@/types/inbound";
import {
    ScannedItem,
    WorkingSession,
    ConfirmState
} from "@/types/inboundScanning";

// --- THAY ĐỔI: Import từ Shadcn UI ---
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";

const STORAGE_KEY = "INBOUND_SCAN_DATA_PERSISTENT";
const REASONS_ITEM = ["Hư hỏng / Rách", "Cận date / Hết hạn", "Sai màu / Size", "Ướt / Bẩn", "Khác"];
const REASONS_INVOICE = ["Thiếu hàng", "Thừa hàng", "Sai lệch chứng từ", "Hư hỏng vận chuyển"];

export default function InboundScanning() {
    const navigate = useNavigate();
    // --- THAY ĐỔI: Sử dụng hook toast ---
    const { toast } = useToast();

    // --- Lấy PO ID từ URL ---
    const [searchParams] = useSearchParams();
    const poId = searchParams.get("id");

    // --- STATE DỮ LIỆU ---
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);

    // 👇 THÊM: State lưu thông tin PO để check Retry Count
    const [poData, setPoData] = useState<PurchaseOrder | null>(null);
    const [isLoadingPO, setIsLoadingPO] = useState(false);

    // 👇 THÊM MỚI: State lưu danh sách lỗi & bật tắt Modal lỗi
    const [errorItems, setErrorItems] = useState<any[]>([]);
    const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);

    // State Modal nhập liệu/báo cáo
    const [session, setSession] = useState<WorkingSession>({ mode: null });

    // State Modal Xác nhận
    const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
        isOpen: false, title: "", message: "", type: 'info', onConfirm: () => {}
    });

    const [tempQty, setTempQty] = useState<string>("");
    const [tempReason, setTempReason] = useState<string>("");
    const [tempNote, setTempNote] = useState<string>("");

    const isLoaded = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [manualCode, setManualCode] = useState("");

    // 👇 LOGIC KHÓA: Nếu retryCount >= 3 thì khóa
    const MAX_RETRIES = 3;
    const isLocked = poData ? (poData.retryCount || 0) >= MAX_RETRIES : false;

    // --- 0. HÀM TẢI THÔNG TIN PO (Thêm đoạn này vào) ---
    const fetchPOData = async () => {
        if (!poId) return; // Nếu không có ID thì thôi
        try {
            // Gọi Service lấy thông tin mới nhất (bao gồm retryCount)
            const data = await inboundService.getPODetail(Number(poId));
            setPoData(data);
        } catch (error) {
            console.error("Lỗi khi tải thông tin PO:", error);
            // Không cần toast lỗi ở đây để tránh spam nếu mạng lag, hoặc tùy bạn
        }
    };

    // Gọi hàm này khi mới vào trang
    useEffect(() => {
        fetchPOData();
    }, [poId]);

    // --- 1. LOCALSTORAGE ---
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
                                    toast({
                                        title: "Khôi phục thành công",
                                        description: "Đã tải lại phiên làm việc trước đó.",
                                    });
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

    useEffect(() => {
        if (isLoaded.current || scannedItems.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scannedItems));
        }
    }, [scannedItems]);

    // --- CÁC HÀM XỬ LÝ ---
    const handleScanResult = async (code: string) => {
        if (isLocked) { // 👈 Chặn quét nếu bị khóa
            toast({ variant: "destructive", title: "Đã bị khóa", description: "Đơn hàng đã hết số lần quét lại." });
            return;
        }
        if (!code) return;
        setIsLoading(true);
        try {
            const product = await productService.getProductByBarcode(code);
            if (product) {
                setTempQty("");
                setSession({ mode: 'ADD', item: { ...product, id: Number(product.productId), inputQty: 0 } });
                toast({
                    title: "Đã tìm thấy",
                    description: `Sản phẩm: ${product.productName}`,
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Lỗi tìm kiếm",
                description: "Không tìm thấy sản phẩm với mã vạch này.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSearch = () => {
        if (isLocked) return; // 👈 Chặn nhập tay
        if (!manualCode.trim()) {
            toast({
                title: "Thiếu thông tin",
                description: "Vui lòng nhập mã vạch để tìm kiếm.",
            });
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

    // --- LOGIC LƯU ---
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
    }

    // --- CÁC HÀM XÁC NHẬN ---
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
                    // 1. Format dữ liệu gửi đi
                    const payload = scannedItems.map(item => ({
                        productId: Number(item.id),
                        actualQty: Number(item.inputQty)
                    }));

                    // 2. Gọi API
                    // Nếu Backend trả về lỗi 400 (Validation), code sẽ nhảy xuống catch ngay lập tức
                    await inboundService.submitInbound(poId, payload);

                    // 3. THÀNH CÔNG (Chỉ chạy khi API trả về 200 OK)
                    setScannedItems([]);
                    localStorage.removeItem(STORAGE_KEY);
                    toast({
                        title: "Thành công!",
                        description: "Nhập kho hoàn tất. Đang chuyển hướng...",
                        className: "bg-green-600 text-white border-green-600"
                    });
                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                    // 👇 SAU KHI GỬI XONG: Gọi lại hàm này để cập nhật số lần đếm
                    fetchPOData();

                    setTimeout(() => navigate("/staff/inbound"), 1000);

                } catch (error: any) {
                    console.error("Lỗi gửi hàng:", error);

                    // 👇 LOGIC BẮT LỖI CHI TIẾT TỪ BACKEND
                    const res = error.response?.data; // { status: 400, message: "...", details: [...] }

                    if (res) {
                        // Trường hợp A: Có danh sách chi tiết từng món sai (details)
                        if (res.details && Array.isArray(res.details) && res.details.length > 0) {
                            setErrorItems(res.details); // Lưu danh sách lỗi
                            setIsErrorModalOpen(true);  // Bật Modal đỏ
                        }
                        // Trường hợp B: Lỗi string thông thường (ví dụ: PO đã đóng, Lỗi server...)
                        else {
                            toast({
                                variant: "destructive",
                                title: "Nhập kho thất bại",
                                description: res.message || "Dữ liệu không hợp lệ."
                            });
                        }
                    } else {
                        // Trường hợp C: Lỗi mạng hoặc không có response
                        toast({ variant: "destructive", title: "Nhập sai số lượng", description: "Không thể kết nối đến server." });
                    }

                    // Đóng modal xác nhận xanh đi
                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                }
            }
        });
    };

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-6 pb-32">
            {/* HEADER */}
            <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5" /></Button>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Nhập kho</h2>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
                    <div className="flex gap-2 w-full md:w-[300px]">
                        <Input placeholder="Mã vạch..." value={manualCode} onChange={(e) => setManualCode(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleManualSearch()} className="bg-white" />
                        <Button variant="secondary" onClick={handleManualSearch}>{isLoading ? <Loader2 className="animate-spin"/> : <Search />}</Button>
                    </div>
                    <div className="w-full md:w-auto">
                        <ScannerButton onScanResult={handleScanResult} className="bg-blue-600 text-white w-full md:w-auto justify-center h-10 px-6"><span className="font-semibold">Quét Camera</span></ScannerButton>
                    </div>
                </div>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <Card className="h-full flex flex-col shadow-sm border border-slate-200">
                <CardHeader className="border-b bg-slate-50 py-3 px-4 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2"><CardTitle className="text-base md:text-lg">Danh sách quét</CardTitle><Badge variant="secondary" className="rounded-full px-2">{scannedItems.length}</Badge></div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500" onClick={handleConfirmDeleteAll} disabled={scannedItems.length === 0}><Trash2 className="w-4 h-4 mr-2" /> Xóa hết</Button>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50/80 sticky top-0">
                                <TableRow>
                                    <TableHead className="min-w-[180px]">Sản phẩm</TableHead>
                                    <TableHead className="text-center w-[80px]">SL</TableHead>
                                    <TableHead className="text-center w-[100px]">Thao tác</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {scannedItems.length === 0 ? (
                                    <TableRow><TableCell colSpan={3} className="h-64 text-center text-slate-400">Chưa có dữ liệu</TableCell></TableRow>
                                ) : (
                                    scannedItems.map((item, index) => (
                                        <TableRow key={index} className={`hover:bg-slate-50 ${item.reportReason ? 'bg-red-50 hover:bg-red-100' : ''}`}>
                                            <TableCell>
                                                <div className="font-medium line-clamp-2">{item.productName}</div>
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{item.barcode}</span>
                                                    <span>{item.unit}</span>
                                                    {item.reportReason && <span className="flex items-center text-red-600 font-bold bg-white px-1 border border-red-200 rounded"><AlertTriangle className="w-3 h-3 mr-1" /> {item.reportReason}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50">{item.inputQty}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="text-amber-500 hover:bg-amber-500" onClick={() => openReportItem(index)} title="Báo lỗi"><Flag className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-blue-500 hover:bg-blue-500" onClick={() => openEdit(index)} title="Sửa"><Edit className="w-4 h-4" /></Button>
                                                    <Button variant="ghost" size="icon" className="text-red-400 hover:bg-red-500" onClick={() => setScannedItems(l => l.filter((_, i) => i !== index))} title="Xóa"><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                {scannedItems.length > 0 && (
                    <div className="border-t bg-slate-50 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="text-sm font-medium text-slate-600">Tổng: {scannedItems.length} mã | SL: {scannedItems.reduce((acc, i) => acc + i.inputQty, 0)}</div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-500 flex-1 sm:flex-none" onClick={openReportInvoice}><FileWarning className="w-4 h-4 mr-2"/> Báo lỗi đơn</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none" onClick={handleConfirmComplete}><Save className="w-4 h-4 mr-2"/> Hoàn thành</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* --- MODAL 1: NHẬP SỐ LƯỢNG --- */}
            {(session.mode === 'ADD' || session.mode === 'EDIT') && session.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">{session.mode === 'ADD' ? 'Thêm mới' : 'Cập nhật'}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setSession({ mode: null })}><X className="w-5 h-5 text-slate-400"/></Button>
                        </div>
                        <div className="p-6 space-y-6 text-center">
                            <div>
                                {session.mode === 'ADD' && <div className="w-24 h-24 mx-auto mb-3"><img src={session.item.imageProduct} className="w-full h-full object-contain" /></div>}
                                <h4 className="font-bold text-lg line-clamp-2">{session.item.productName}</h4>
                                <p className="text-sm text-slate-500 mt-1">{session.item.barcode}</p>
                            </div>
                            <div>
                                <Label className="mb-2 block text-slate-500">Số lượng thực tế</Label>
                                <Input type="number" value={tempQty} onChange={(e) => setTempQty(e.target.value)} placeholder="0" className="text-4xl h-16 text-center font-bold text-blue-600 bg-slate-50" autoFocus onKeyDown={(e) => e.key === "Enter" && handleSave()} />
                            </div>
                            <Button className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                                {session.mode === 'ADD' ? 'Thêm vào danh sách' : 'Lưu thay đổi'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: BÁO CÁO --- */}
            {(session.mode === 'REPORT_ITEM' || session.mode === 'REPORT_INVOICE') && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
                        <div className={`p-4 border-b flex justify-between items-center ${session.mode === 'REPORT_ITEM' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                {session.mode === 'REPORT_ITEM' ? <><Flag className="w-5 h-5"/> Báo lỗi sản phẩm</> : <><FileWarning className="w-5 h-5"/> Báo lỗi hóa đơn</>}
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setSession({ mode: null })}><X className="w-5 h-5"/></Button>
                        </div>
                        <div className="p-5 space-y-4">
                            {session.mode === 'REPORT_ITEM' && session.item && (
                                <div className="bg-slate-50 p-3 rounded border">
                                    <p className="font-medium text-sm">{session.item.productName}</p>
                                    <p className="text-xs text-slate-500">{session.item.barcode}</p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Chọn vấn đề:</Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {(session.mode === 'REPORT_ITEM' ? REASONS_ITEM : REASONS_INVOICE).map(r => (
                                        <div key={r} onClick={() => setTempReason(r)} className={`p-3 border rounded cursor-pointer text-xs font-medium transition-all ${tempReason === r ? 'border-red-500 bg-red-50 text-red-700' : 'hover:bg-slate-50'}`}>{r}</div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Ghi chú:</Label>
                                <Textarea className="w-full" placeholder="Chi tiết..." value={tempNote} onChange={(e) => setTempNote(e.target.value)} />
                            </div>

                            <div className="flex gap-2">
                                {session.mode === 'REPORT_ITEM' && session.item?.reportReason && (
                                    <Button variant="outline" className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-100" onClick={handleClearItemReport}>
                                        <RefreshCcw className="w-4 h-4 mr-2"/> Gỡ báo cáo
                                    </Button>
                                )}
                                <Button className={`flex-1 ${session.mode === 'REPORT_ITEM' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`} onClick={handleSave}>
                                    Xác nhận
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: KHUNG XÁC NHẬN --- */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 text-center space-y-4">
                            <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center ${confirmDialog.type === 'danger' ? 'bg-red-100 text-red-600' : confirmDialog.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                                {confirmDialog.type === 'danger' ? <Trash2 className="w-6 h-6"/> : confirmDialog.type === 'success' ? <CheckCircle className="w-6 h-6"/> : <AlertCircle className="w-6 h-6"/>}
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 mb-2">{confirmDialog.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{confirmDialog.message}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <Button variant="outline" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}>
                                    Hủy bỏ
                                </Button>
                                <Button
                                    className={confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : confirmDialog.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600'}
                                    onClick={confirmDialog.onConfirm}
                                >
                                    Đồng ý
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: DANH SÁCH HÀNG NHẬP SAI (MỚI) --- */}
            {isErrorModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-red-200">
                        {/* Header Đỏ */}
                        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center text-red-700">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileWarning className="w-5 h-5" />
                                Phát hiện lỗi nhập kho
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsErrorModalOpen(false)} className="hover:bg-red-100 text-red-500">
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Danh sách chi tiết lỗi */}
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead>Lý do lỗi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {errorItems.map((err, idx) => {
                                        // Tìm tên sản phẩm trong danh sách đã quét để hiển thị cho Staff dễ hiểu
                                        // Backend trả về 'productId' (string hoặc number)
                                        const originalItem = scannedItems.find(i => i.id === Number(err.productId));
                                        const productName = originalItem ? originalItem.productName : `Sản phẩm ID #${err.productId}`;

                                        return (
                                            <TableRow key={idx} className="bg-red-50/30 hover:bg-red-50">
                                                <TableCell className="py-3 align-top">
                                                    <div className="font-medium text-sm text-slate-800 line-clamp-2">{productName}</div>
                                                    {originalItem && <div className="text-xs text-slate-500 mt-1">{originalItem.barcode}</div>}
                                                </TableCell>
                                                <TableCell className="py-3 align-top">
                                                    <span className="text-red-600 font-semibold text-xs bg-red-100 px-2 py-1 rounded-md inline-block">
                                                        {err.message || "Sai thông tin"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-50 border-t flex flex-col gap-3">
                            <div className="text-xs text-slate-500 italic flex gap-2 items-start">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>Vui lòng kiểm tra và xóa các mặt hàng không hợp lệ khỏi danh sách quét trước khi gửi lại.</span>
                            </div>
                            <Button className="w-full bg-slate-800 hover:bg-slate-900" onClick={() => setIsErrorModalOpen(false)}>
                                Đã hiểu, để tôi sửa lại
                            </Button>
                        </div>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}