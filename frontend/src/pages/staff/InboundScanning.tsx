import { useNavigate, useSearchParams } from "react-router-dom";
import { useInboundScanning } from "@/hooks/useInboundScanning"; // IMPORT HOOK VỪA TẠO
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Loader2, Search, ArrowLeft, Save, Edit, X, Flag, AlertTriangle, FileWarning, RefreshCcw, AlertCircle, CheckCircle } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";

const REASONS_ITEM = ["Hư hỏng / Rách", "Cận date / Hết hạn", "Sai màu / Size", "Ướt / Bẩn", "Khác"];
const REASONS_INVOICE = ["Thiếu hàng", "Thừa hàng", "Sai lệch chứng từ", "Hư hỏng vận chuyển"];

export default function InboundScanning() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const poId = searchParams.get("id");

    // SỬ DỤNG HOOK
    const {
        scannedItems, setScannedItems,
        isLoading,
        manualCode, setManualCode,
        session, setSession,
        confirmDialog, setConfirmDialog,
        errorItems, isErrorModalOpen, setIsErrorModalOpen,
        tempQty, setTempQty,
        tempReason, setTempReason,
        tempNote, setTempNote,

        handleScanResult,
        handleManualSearch,
        handleSave,
        handleClearItemReport,
        handleConfirmDeleteAll,
        handleConfirmComplete,
        openEdit,
        openReportItem,
        openReportInvoice
    } = useInboundScanning(poId);

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
                        <Input
                            placeholder="Mã vạch..."
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                            className="bg-white"
                        />
                        <Button variant="secondary" onClick={handleManualSearch}>
                            {isLoading ? <Loader2 className="animate-spin"/> : <Search />}
                        </Button>
                    </div>
                    <div className="w-full md:w-auto">
                        <ScannerButton onScanResult={handleScanResult} className="bg-blue-600 text-white w-full md:w-auto justify-center h-10 px-6">
                            <span className="font-semibold">Quét Camera</span>
                        </ScannerButton>
                    </div>
                </div>
            </div>

            {/* DANH SÁCH SẢN PHẨM */}
            <Card className="h-full flex flex-col shadow-sm border border-slate-200">
                <CardHeader className="border-b bg-slate-50 py-3 px-4 flex flex-row justify-between items-center">
                    <div className="flex items-center gap-2">
                        <CardTitle className="text-base md:text-lg">Danh sách quét</CardTitle>
                        <Badge variant="secondary" className="rounded-full px-2">{scannedItems.length}</Badge>
                    </div>
                    <Button size="sm" variant="ghost" className="text-red-500 hover:bg-red-500" onClick={handleConfirmDeleteAll} disabled={scannedItems.length === 0}>
                        <Trash2 className="w-4 h-4 mr-2" /> Xóa hết
                    </Button>
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
                                                    <span className="bg-red-200 px-1.5 py-0.5 rounded border">{item.sku}</span>
                                                    <span>{item.unit}</span>
                                                    {item.reportReason && <span className="flex items-center text-red-600 font-bold bg-white px-1 border border-red-200 rounded"><AlertTriangle className="w-3 h-3 mr-1" /> {item.reportReason}</span>}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-xs border-blue-200 bg-blue-50">{item.inputQty}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
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
                                {session.mode === 'ADD' && <div className="w-24 h-24 mx-auto mb-3"><img src={session.item.image} className="w-full h-full object-contain" alt="product" /></div>}
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



            {/* --- MODAL 2: BÁO CÁO HÓA ĐƠN (Đã sửa đổi) --- */}
            {session.mode === 'REPORT_INVOICE' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm duration-200">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-amber-200">

                        {/* HEADER: Màu cam cho Báo lỗi hóa đơn */}
                        <div className="bg-amber-50 p-4 border-b border-amber-100 flex justify-between items-center text-amber-800">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <FileWarning className="w-5 h-5"/> Báo lỗi hóa đơn
                            </h3>
                            <Button variant="ghost" size="icon" onClick={() => setSession({ mode: null })} className="hover:bg-amber-100 text-amber-600">
                                <X className="w-5 h-5"/>
                            </Button>
                        </div>

                        {/* BODY: Hiển thị danh sách lỗi (Code lấy từ Modal 4 đưa sang) */}
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sản phẩm</TableHead>
                                        <TableHead>Lý do lỗi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Lưu ý: Đảm bảo biến 'errorItems' có dữ liệu khi mở Modal này */}
                                    {errorItems.map((err, idx) => {
                                        const originalItem = scannedItems.find(i => i.id === Number(err.productId));
                                        const productName = originalItem ? originalItem.productName : `Sản phẩm #${err.productName} - ${err.productName}`;
                                        return (
                                            <TableRow key={idx} className="bg-amber-50/30 hover:bg-amber-50">
                                                <TableCell className="py-3 align-top">
                                                    <div className="font-medium text-sm text-slate-800 line-clamp-2">{productName}</div>
                                                    {originalItem && <div className="text-xs text-slate-500 mt-1">{originalItem.id}</div>}
                                                </TableCell>
                                                <TableCell className="py-3 align-top">
                                                    <span className="text-red-600 font-semibold text-xs bg-red-100 px-2 py-1 rounded-md inline-block">
                                                        {err.message || "Lỗi nhập liệu"}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {errorItems.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} className="text-center py-8 text-slate-500 italic">
                                                Không có lỗi chi tiết nào để hiển thị.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* FOOTER: Nút xác nhận */}
                        <div className="p-4 bg-slate-50 border-t flex flex-col gap-3">
                            <div className="text-xs text-slate-500 italic flex gap-2 items-start">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>Danh sách trên sẽ được gửi kèm với báo cáo lỗi hóa đơn này.</span>
                            </div>

                            {/* Giữ nguyên logic nút xác nhận gọi handleSave */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    className="w-full flex-1 bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-200"
                                    onClick={handleSave}
                                >
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
                                <Button variant="outline" onClick={() => setConfirmDialog(prev => ({...prev, isOpen: false}))}>Hủy bỏ</Button>
                                <Button className={confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : confirmDialog.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600'} onClick={confirmDialog.onConfirm}>Đồng ý</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: DANH SÁCH HÀNG NHẬP SAI --- */}
            {isErrorModalOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 border border-red-200">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center text-red-700">
                            <h3 className="font-bold text-lg flex items-center gap-2"><FileWarning className="w-5 h-5" /> Phát hiện lỗi nhập kho</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsErrorModalOpen(false)} className="hover:bg-red-100 text-red-500"><X className="w-5 h-5" /></Button>
                        </div>
                        <div className="p-0 max-h-[60vh] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow><TableHead>Sản phẩm</TableHead><TableHead>Lý do lỗi</TableHead></TableRow>
                                </TableHeader>
                                <TableBody>
                                    {errorItems.map((err, idx) => {
                                        const originalItem = scannedItems.find(i => i.id === Number(err.productId));
                                        const productName = originalItem ? originalItem.productName : `Sản phẩm #${err.sku} - ${err.productName}`;
                                        return (
                                            <TableRow key={idx} className="bg-red-50/30 hover:bg-red-50">
                                                <TableCell className="py-3 align-top">
                                                    <div className="font-medium text-sm text-slate-800 line-clamp-2">{productName}</div>
                                                    {originalItem && <div className="text-xs text-slate-500 mt-1">{originalItem.barcode}</div>}
                                                </TableCell>
                                                <TableCell className="py-3 align-top">
                                                    <span className="text-red-600 font-semibold text-xs bg-red-100 px-2 py-1 rounded-md inline-block">{err.message || "Sai thông tin"}</span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex flex-col gap-3">
                            <div className="text-xs text-slate-500 italic flex gap-2 items-start">
                                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                <span>Vui lòng kiểm tra và xóa các mặt hàng không hợp lệ khỏi danh sách quét trước khi gửi lại.</span>
                            </div>
                            <Button className="w-full bg-slate-800 hover:bg-slate-900" onClick={() => setIsErrorModalOpen(false)}>Đã hiểu, để tôi sửa lại</Button>
                        </div>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}