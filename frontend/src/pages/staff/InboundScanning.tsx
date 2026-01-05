import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { Textarea } from "@/components/ui/textarea"; 
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2, Loader2, Search, ArrowLeft, Save, Edit, X, Flag, AlertTriangle, FileWarning, RefreshCcw, AlertCircle, CheckCircle } from "lucide-react";
import { productService} from "@/services/product.service";
import { 
    ScannedItem, 
    WorkingSession, 
    ConfirmState 
} from "@/types/inboundScanning";

const STORAGE_KEY = "INBOUND_SCAN_DATA_PERSISTENT";
const REASONS_ITEM = ["Hư hỏng / Rách", "Cận date / Hết hạn", "Sai màu / Size", "Ướt / Bẩn", "Khác"];
const REASONS_INVOICE = ["Thiếu hàng", "Thừa hàng", "Sai lệch chứng từ", "Hư hỏng vận chuyển"];

export default function InboundScanning() {
    const navigate = useNavigate();
    
    // --- STATE DỮ LIỆU ---
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    
    // State Modal nhập liệu/báo cáo
    const [session, setSession] = useState<WorkingSession>({ mode: null });
    
    // State Modal Xác nhận (Khung xác nhận)
    const [confirmDialog, setConfirmDialog] = useState<ConfirmState>({
        isOpen: false, title: "", message: "", type: 'info', onConfirm: () => {}
    });

    const [tempQty, setTempQty] = useState<string>("");
    const [tempReason, setTempReason] = useState<string>("");
    const [tempNote, setTempNote] = useState<string>("");

    const isLoaded = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [manualCode, setManualCode] = useState("");

    // --- 1. LOCALSTORAGE ---
    useEffect(() => {
        const checkOldData = () => {
            try {
                const savedJson = localStorage.getItem(STORAGE_KEY);
                if (savedJson) {
                    const parsedData = JSON.parse(savedJson);
                    if (Array.isArray(parsedData) && parsedData.length > 0) {
                        setTimeout(() => {
                            // Dùng confirm modal của mình thay vì window.confirm
                            setConfirmDialog({
                                isOpen: true,
                                title: "Phát hiện dữ liệu cũ",
                                message: `Bạn có ${parsedData.length} sản phẩm đang nhập dở từ lần trước. Bạn muốn khôi phục không?`,
                                type: 'info',
                                onConfirm: () => {
                                    setScannedItems(parsedData);
                                    toast.success("Đã khôi phục phiên làm việc!");
                                    setConfirmDialog(prev => ({...prev, isOpen: false}));
                                }
                            });
                            // Nếu hủy thì thôi (để logic mặc định xóa)
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

    // --- CÁC HÀM MỞ MODAL ---
    const handleScanResult = async (code: string) => {
        if (!code) return;
        setIsLoading(true);
        try {
            const product = await productService.getProductByBarcode(code);
            if (product) {
                setTempQty(""); 
                setSession({ mode: 'ADD', item: { ...product, inputQty: 0 } });
                toast.success(`Tìm thấy: ${product.productName}`);
            }
        } catch (error) {
            toast.error("Không tìm thấy sản phẩm");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManualSearch = () => {
        if (!manualCode.trim()) {
            toast.warning("Vui lòng nhập mã");
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

    // --- LOGIC XỬ LÝ LƯU ---
    const handleSave = () => {
        const list = [...scannedItems];

        switch (session.mode) {
            case 'ADD':{
                if (!session.item) return;
                const addQty = parseInt(tempQty);
                if (isNaN(addQty) || addQty <= 0) { toast.error("Số lượng > 0"); return; }
                const existIdx = list.findIndex(i => i.barcode === session.item!.barcode);
                if (existIdx >= 0) {
                    list[existIdx].inputQty += addQty;
                    toast.success(`Cộng thêm +${addQty}`);
                } else {
                    list.push({ ...session.item, inputQty: addQty });
                    toast.success("Đã thêm mới!");
                }
                setScannedItems(list);
                break;
            }
            case 'EDIT':{
                if (session.index === undefined) return;
                const editQty = parseInt(tempQty);
                if (isNaN(editQty) || editQty <= 0) { toast.error("Số lượng > 0"); return; }
                list[session.index].inputQty = editQty;
                setScannedItems(list);
                toast.success("Đã cập nhật!");
                break;
            }

            case 'REPORT_ITEM':
                if (session.index === undefined) return;
                list[session.index].reportReason = tempReason;
                list[session.index].note = tempNote;
                setScannedItems(list);
                toast.warning("Đã gán lỗi cho sản phẩm");
                break;

            case 'REPORT_INVOICE':
                // Đây là lúc gửi báo cáo hóa đơn
                console.log("Report Invoice:", { reason: tempReason, note: tempNote });
                toast.error("Đã gửi báo cáo hóa đơn!");
                break;
        }
        setSession({ mode: null });
    };

    // --- HÀM XÓA BÁO CÁO SẢN PHẨM ---
    const handleClearItemReport = () => {
        if (session.mode === 'REPORT_ITEM' && session.index !== undefined) {
            const list = [...scannedItems];
            // Xóa các trường báo cáo
            delete list[session.index].reportReason;
            delete list[session.index].note;
            setScannedItems(list);
            setSession({ mode: null });
            toast.info("Đã gỡ bỏ báo cáo lỗi cho sản phẩm này.");
        }
    }

    // --- CÁC HÀM XÁC NHẬN (CONFIRMATION) ---
    
    // 1. Xóa tất cả
    const handleConfirmDeleteAll = () => {
        setConfirmDialog({
            isOpen: true,
            title: "Xóa tất cả?",
            message: "Bạn có chắc muốn xóa toàn bộ danh sách đã quét? Hành động này không thể hoàn tác.",
            type: 'danger',
            onConfirm: () => {
                setScannedItems([]);
                localStorage.removeItem(STORAGE_KEY);
                toast.success("Đã xóa danh sách");
                setConfirmDialog(prev => ({...prev, isOpen: false}));
            }
        });
    };

    // 2. Hoàn thành
    const handleConfirmComplete = () => {
        if (scannedItems.length === 0) return;
        setConfirmDialog({
            isOpen: true,
            title: "Xác nhận nhập kho",
            message: `Bạn đang gửi ${scannedItems.length} mã sản phẩm lên hệ thống. Hãy chắc chắn thông tin đã chính xác.`,
            type: 'success',
            onConfirm: () => {
                console.log("Submit:", scannedItems);
                // Call API here... (BÌNH LÀM Ở ĐÂY NÈ THÊM API)
                
                setScannedItems([]);
                localStorage.removeItem(STORAGE_KEY);
                toast.success("Nhập kho thành công!");
                setConfirmDialog(prev => ({...prev, isOpen: false}));
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
                    {/* Nút Xóa Tất Cả -> Gọi khung xác nhận */}
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
                            
                            {/* Nút Hoàn thành -> Gọi khung xác nhận */}
                            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none" onClick={handleConfirmComplete}><Save className="w-4 h-4 mr-2"/> Hoàn thành</Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* --- MODAL 1: NHẬP SỐ LƯỢNG (Dùng cho ADD & EDIT) --- */}
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

            {/* --- MODAL 2: BÁO CÁO (Dùng cho REPORT_ITEM & REPORT_INVOICE) --- */}
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
                                {/* Nếu đang là Report Item và ĐÃ CÓ lý do -> Hiện nút Xóa báo cáo */}
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

            {/* --- MODAL 3: KHUNG XÁC NHẬN CHUNG (CONFIRMATION FRAME) --- */}
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
        </div>
    );
}