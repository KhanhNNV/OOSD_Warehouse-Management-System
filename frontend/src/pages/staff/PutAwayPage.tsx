import React, { useState, useEffect } from "react";
import { usePutAwayScanner } from "@/hooks/usePutAwayScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft, Loader2, ScanLine,
    RefreshCw, MapPin, CheckCircle2, Scan, PackageOpen, Search
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function PutAwayPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // 1. Sử dụng Hook
    const {
        session, setSession,
        transitList, suggestedShelves, scannedShelf, isLoading,
        handleScan, submitPutAway, refreshData
    } = usePutAwayScanner();

    // 2. Local State
    const [manualCode, setManualCode] = useState("");
    const [formData, setFormData] = useState({ qty: "1", exp: "" });

    // Sync dữ liệu vào Form nhập chi tiết
    useEffect(() => {
        if (session.step === 'INPUT_DETAILS' && session.selectedItem) {
            setFormData({
                qty: session.selectedItem.quantity.toString(),
                exp: session.expDate || ""
            });
        }
    }, [session.step, session.selectedItem]);

    // Xử lý nút Back tùy chỉnh
    const handleBackStep = () => {
        if (session.step === 'INPUT_DETAILS') {
            setSession(prev => ({ ...prev, step: 'SCAN_LOCATION' }));
        } else if (session.step === 'SCAN_LOCATION') {
            setSession(prev => ({ ...prev, step: 'SCAN_PRODUCT' }));
        } else {
            // Nếu muốn nút back ở trang chủ quay về dashboard thì uncomment dòng dưới
            // navigate(-1);
        }
    };

    const handleFinalSubmit = async () => {
        const qty = parseInt(formData.qty);
        if (!qty || qty <= 0) {
            toast({ variant: "destructive", description: "Số lượng không hợp lệ" });
            return;
        }
        if (session.selectedItem && qty > session.selectedItem.quantity) {
            toast({ variant: "destructive", description: "Số lượng nhập lớn hơn số lượng đang giữ" });
            return;
        }
        const success = await submitPutAway(qty, formData.exp);
        if (success) {
            setFormData({ qty: "1", exp: "" });
        }
    };

    const handleManualSubmit = () => {
        if (manualCode) {
            handleScan(manualCode);
            setManualCode("");
        }
    };

    // --- UI: Danh sách sản phẩm (Phóng to) ---
    const renderProductList = () => (
        <div className="space-y-6 animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-1">
                <span className="text-sm font-bold text-slate-500 uppercase tracking-wide">
                    Hàng chờ cất ({transitList.length})
                </span>
                <Button variant="outline" size="sm" className="gap-2" onClick={refreshData}>
                    <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>
            
            <ScrollArea className="h-[500px] pr-4">
                {transitList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-60 text-slate-400 gap-4 border-2 border-dashed rounded-xl bg-slate-50">
                        <PackageOpen className="w-12 h-12 opacity-50"/>
                        <span className="text-lg font-medium">Không có hàng trong Transit</span>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {transitList.map((item) => (
                            <div key={item.productId}
                                 onClick={() => handleScan(item.barcode)}
                                 className="bg-white p-5 rounded-xl border shadow-sm cursor-pointer hover:border-blue-500 hover:shadow-md transition-all group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="font-bold text-lg text-slate-800 group-hover:text-blue-700">{item.productName}</div>
                                        <div className="text-sm text-slate-500 font-mono mt-1 flex items-center gap-2">
                                            <span className="bg-slate-100 px-2 py-0.5 rounded">{item.sku}</span>
                                            <span>|</span>
                                            <span>{item.barcode}</span>
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700 text-base px-3 py-1 hover:bg-blue-200">
                                        SL: {item.quantity}
                                    </Badge>
                                </div>
                                
                                {/* Hiển thị gợi ý nhỏ bên dưới nếu đã từng load */}
                                <div className="flex items-center gap-2 text-sm text-slate-400 mt-2 border-t pt-2 border-slate-100">
                                    <MapPin className="w-4 h-4"/>
                                    <span>Bấm chọn để xem vị trí cất</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    // --- UI: Quét vị trí (Phóng to) ---
    const renderScanLocation = () => {
        const hasSuggestion = suggestedShelves.length > 0;
        const suggestedLoc = hasSuggestion ? suggestedShelves[0] : "---";

        return (
            <div className="space-y-8 animate-in slide-in-from-right pt-2">
                {/* Thông tin sản phẩm đang cầm */}
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                    <div className="text-sm text-blue-600 uppercase font-bold mb-2 tracking-wider">Đang cất sản phẩm:</div>
                    <h3 className="font-bold text-2xl text-slate-900 leading-tight mb-3">{session.selectedItem?.productName}</h3>
                    <div className="flex gap-4 text-base text-slate-700">
                        <span className="bg-white px-3 py-1 rounded border border-blue-200 font-mono font-bold text-blue-800">
                            {session.selectedItem?.sku}
                        </span>
                        <span className="flex items-center gap-1">
                            SL cần cất: <b className="text-xl">{session.selectedItem?.quantity}</b>
                        </span>
                    </div>
                </div>

                {/* Khu vực hiển thị Gợi Ý - Phóng to */}
                <div className={`text-center py-10 rounded-2xl border-4 border-dashed transition-colors ${hasSuggestion ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-sm font-bold uppercase tracking-widest mb-4 text-slate-500">
                        Vị trí hệ thống đề xuất
                    </div>
                    
                    {isLoading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="w-12 h-12 animate-spin text-blue-600"/>
                        </div>
                    ) : (
                        <div className={`text-6xl font-black font-mono tracking-tighter ${hasSuggestion ? 'text-green-600' : 'text-slate-300'}`}>
                            {hasSuggestion ? suggestedLoc : "CHƯA CÓ"}
                        </div>
                    )}

                    <div className="mt-6 flex items-center justify-center gap-3 text-lg text-slate-600">
                        {hasSuggestion ? (
                            <>
                                <MapPin className="w-6 h-6 text-green-600" />
                                <span>Hãy di chuyển đến kệ <b>{suggestedLoc}</b></span>
                            </>
                        ) : (
                            <span>Không tìm thấy vị trí phù hợp trong cấu hình.</span>
                        )}
                    </div>
                </div>

                {/* Hướng dẫn */}
                <div className="flex items-center justify-center gap-3 text-slate-500 bg-white p-4 rounded-lg border">
                    <Scan className="w-6 h-6 animate-pulse text-blue-600" />
                    <span className="text-lg font-medium">Vui lòng quét mã kệ để xác nhận</span>
                </div>

                <Button variant="outline" size="lg" className="w-full h-14 text-lg border-slate-300 text-slate-600 hover:bg-slate-100 hover:text-slate-900" onClick={handleBackStep}>
                    Hủy, chọn sản phẩm khác
                </Button>
            </div>
        );
    };

    // --- UI: Nhập số lượng (Phóng to) ---
    const renderInputDetails = () => (
        <div className="space-y-6 animate-in slide-in-from-right pt-4">
            <div className="flex items-center gap-4 bg-green-50 p-6 rounded-xl border border-green-200 text-green-900 shadow-sm">
                <div className="bg-green-100 p-3 rounded-full">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div>
                    <div className="font-bold text-2xl">{scannedShelf}</div>
                    <div className="text-sm opacity-80 uppercase font-semibold tracking-wide">Vị trí chính xác</div>
                </div>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-xl border shadow-sm">
                <div>
                    <Label className="text-slate-500 mb-2 block text-lg">Số lượng thực tế cất</Label>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="h-16 w-16 shrink-0 rounded-xl border-slate-300" 
                            onClick={() => setFormData(p => ({...p, qty: (Math.max(1, parseInt(p.qty)-1)).toString()}))}>
                            <span className="text-3xl font-bold text-slate-600">-</span>
                        </Button>
                        <Input
                            type="number"
                            value={formData.qty}
                            onChange={e => setFormData({...formData, qty: e.target.value})}
                            className="text-4xl font-bold text-center h-16 rounded-xl border-slate-300 focus:ring-4 focus:ring-blue-100"
                            autoFocus
                        />
                        <Button variant="outline" className="h-16 w-16 shrink-0 rounded-xl border-slate-300" 
                             onClick={() => setFormData(p => ({...p, qty: (parseInt(p.qty)+1).toString()}))}>
                             <span className="text-3xl font-bold text-slate-600">+</span>
                        </Button>
                    </div>
                </div>
                
                <div>
                    <Label className="text-slate-500 mb-2 block text-lg">Hạn sử dụng (nếu có)</Label>
                    <Input type="date" className="h-14 text-xl px-4 rounded-xl border-slate-300" value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})}/>
                </div>
            </div>

            <div className="flex gap-4 pt-4">
                <Button variant="outline" size="lg" className="flex-1 h-16 text-xl rounded-xl border-slate-300" disabled={isLoading} onClick={handleBackStep}>
                    Quay lại
                </Button>
                <Button size="lg" className="flex-[2] h-16 text-xl rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-[0.98]" disabled={isLoading} onClick={handleFinalSubmit}>
                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin mr-3"/> : <PackageOpen className="w-6 h-6 mr-3"/>}
                    Xác nhận Cất
                </Button>
            </div>
        </div>
    );

    return (
        // Tăng max-width lên 3xl để giao diện to hơn trên PC/Tablet
        <div className="max-w-3xl mx-auto min-h-screen bg-slate-50 pb-24 font-sans">
            
            {/* Header */}
            <div className="bg-white border-b px-6 py-4 flex items-center gap-4 sticky top-0 z-20 shadow-sm">
                {/* Ẩn nút back nếu đang ở trang danh sách (bước 1) */}
                {session.step !== 'SCAN_PRODUCT' && (
                    <Button variant="ghost" size="icon" className="-ml-3 hover:bg-slate-100 rounded-full h-10 w-10" onClick={handleBackStep}>
                        <ArrowLeft className="w-6 h-6 text-slate-700" />
                    </Button>
                )}
                
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Put Away</h1>
                    <div className="text-sm text-slate-500 font-medium">Quy trình cất hàng vào kệ</div>
                </div>
            </div>

            {/* Thanh tiến trình (Steps) */}
            <div className="flex px-6 py-4 gap-2 bg-white border-b border-slate-100 mb-6">
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${session.step === 'SCAN_PRODUCT' ? 'bg-blue-600' : 'bg-blue-100'}`}/>
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${session.step === 'SCAN_LOCATION' ? 'bg-blue-600' : (session.step === 'INPUT_DETAILS' ? 'bg-blue-600' : 'bg-slate-200')}`}/>
                <div className={`h-2 flex-1 rounded-full transition-all duration-300 ${session.step === 'INPUT_DETAILS' ? 'bg-blue-600' : 'bg-slate-200'}`}/>
            </div>

            {/* Main Content */}
            <div className="px-6">
                
                {/* Thanh Quét Mã (Di chuyển lên đầu) - Chỉ hiện khi không phải bước nhập chi tiết */}
                {session.step !== 'INPUT_DETAILS' && (
                    <div className="bg-white p-4 rounded-xl border shadow-sm mb-6 flex gap-3 sticky top-[100px] z-10">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"/>
                            <Input
                                value={manualCode}
                                onChange={e => setManualCode(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                                placeholder={session.step === 'SCAN_PRODUCT' ? "Quét mã SP hoặc SKU..." : "Quét mã Kệ (VD: A-01-01)..."}
                                className="h-14 text-lg pl-10 rounded-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <ScannerButton
                            onScanResult={(val) => handleScan(val)}
                            className="h-14 w-16 bg-slate-800 text-white rounded-lg shrink-0 flex items-center justify-center hover:bg-slate-700 active:scale-95 transition-all shadow-lg shadow-slate-200"
                        >
                            {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <ScanLine className="w-7 h-7"/>}
                        </ScannerButton>
                    </div>
                )}

                {/* Nội dung chính thay đổi theo Step */}
                <div className="transition-all duration-300 ease-in-out">
                    {session.step === 'SCAN_PRODUCT' && renderProductList()}
                    {session.step === 'SCAN_LOCATION' && renderScanLocation()}
                    {session.step === 'INPUT_DETAILS' && renderInputDetails()}
                </div>
            </div>

            <Toaster />
        </div>
    );
}