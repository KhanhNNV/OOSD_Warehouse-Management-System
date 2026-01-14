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
    RefreshCw, ChevronRight, PackageOpen, MapPin, CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function PutAwayPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // 1. Sử dụng Hook đã Clean
    const {
        session, setSession,
        transitList, suggestedShelves, scannedShelf, isLoading,
        handleScan, submitPutAway, refreshData
    } = usePutAwayScanner();

    // 2. Local State (Chỉ chứa những thứ thuộc về UI/Form)
    const [manualCode, setManualCode] = useState("");
    const [formData, setFormData] = useState({ qty: "1", mfg: "", exp: "" });

    // Sync dữ liệu vào Form khi chọn xong sản phẩm
    useEffect(() => {
        if (session.step === 'INPUT_DETAILS' && session.selectedItem) {
            setFormData({
                qty: session.selectedItem.quantity.toString(),
                mfg: session.mfgDate || "",
                exp: session.expDate || ""
            });
        }
    }, [session.step, session.selectedItem]);

    // Wrapper để gọi hàm submit từ hook và validate cơ bản
    const handleFinalSubmit = async () => {
        const qty = parseInt(formData.qty);

        // Validate UI cơ bản
        if (!qty || qty <= 0) {
            toast({ variant: "destructive", description: "Số lượng không hợp lệ" });
            return;
        }
        if (session.selectedItem && qty > session.selectedItem.quantity) {
            toast({ variant: "destructive", description: "Số lượng nhập lớn hơn số lượng đang giữ" });
            return;
        }

        // Gọi Hook
        const success = await submitPutAway(qty, formData.mfg, formData.exp);
        if (success) {
            setFormData({ qty: "1", mfg: "", exp: "" }); // Clear form nếu thành công
        }
    };

    const handleManualSubmit = () => {
        if (manualCode) {
            handleScan(manualCode);
            setManualCode("");
        }
    };

    // --- RENDER HELPERS ---
    const renderProductList = () => (
        <div className="space-y-4 animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-500 uppercase">Hàng đang giữ ({transitList.length})</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshData}>
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
            </div>
            <ScrollArea className="h-[400px] pr-2">
                {transitList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <PackageOpen className="w-8 h-8 opacity-50"/>
                        <span className="text-xs">Transit trống</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transitList.map((item) => (
                            <div key={item.productId}
                                 onClick={() => handleScan(item.barcode)}
                                 className="bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:border-blue-400 transition-colors"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800">{item.productName}</div>
                                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">{item.barcode}</div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700">{item.quantity}</Badge>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-dashed border-slate-200 flex flex-wrap gap-2 items-center">
                                    <MapPin className="w-3 h-3 text-slate-400 shrink-0"/>
                                    {suggestedShelves.length > 0 ? suggestedShelves.map(shelf => (
                                        <span key={shelf} className="text-[10px] font-bold px-1.5 py-0.5 bg-green-100 text-green-700 rounded border border-green-200">
                                            {shelf}
                                        </span>
                                    )) : <span className="text-[10px] text-slate-400 italic">...</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    const renderScanLocation = () => (
        <div className="space-y-4 animate-in slide-in-from-right">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900">{session.selectedItem?.productName}</h3>
                <div className="text-xs text-blue-600 mt-1">Barcode: {session.selectedItem?.barcode}</div>
            </div>
            <div className="text-center py-4">
                <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
                    <MapPin className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="font-bold text-slate-800">Quét vị trí cất</h2>
                <div className="flex flex-wrap gap-2 justify-center px-4 mt-4">
                    {suggestedShelves.map(shelf => (
                        <div key={shelf} onClick={() => handleScan(shelf)}
                             className="cursor-pointer px-3 py-1 bg-white border border-slate-200 rounded text-sm font-mono font-bold hover:bg-green-50 hover:border-green-500 hover:text-green-700">
                            {shelf}
                        </div>
                    ))}
                </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSession(prev => ({...prev, step: 'SCAN_PRODUCT'}))}>
                Quay lại
            </Button>
        </div>
    );

    const renderInputDetails = () => (
        <div className="space-y-4 animate-in slide-in-from-right">
            <div className="flex items-center gap-2 text-sm bg-green-50 p-3 rounded border border-green-200 text-green-800">
                <CheckCircle2 className="w-5 h-5" />
                <div>
                    <div>Vị trí: <span className="font-bold">{scannedShelf}</span></div>
                    <div className="text-xs opacity-80">{session.selectedItem?.productName}</div>
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <Label>Số lượng cất</Label>
                    <Input
                        type="number"
                        value={formData.qty}
                        onChange={e => setFormData({...formData, qty: e.target.value})}
                        className="text-2xl font-bold text-center h-14"
                        autoFocus
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div><Label>Ngày SX</Label><Input type="date" value={formData.mfg} onChange={e => setFormData({...formData, mfg: e.target.value})}/></div>
                    <div><Label>Hạn SD</Label><Input type="date" value={formData.exp} onChange={e => setFormData({...formData, exp: e.target.value})}/></div>
                </div>
            </div>

            <div className="flex gap-2 pt-4">
                <Button variant="outline" className="flex-1" disabled={isLoading} onClick={() => setSession(prev => ({...prev, step: 'SCAN_LOCATION'}))}>
                    Quay lại
                </Button>
                <Button className="flex-[2] bg-blue-600 hover:bg-blue-700" disabled={isLoading} onClick={handleFinalSubmit}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <PackageOpen className="w-4 h-4 mr-2"/>}
                    Hoàn tất
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen bg-slate-50 pb-24">
            <div className="flex items-center gap-3 mb-2 sticky top-0 bg-slate-50 pt-2 pb-2 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="w-5 h-5 text-slate-600" /></Button>
                <h1 className="text-lg font-bold text-slate-800">Put Away</h1>
            </div>

            <div className="flex gap-1 mb-4 px-1">
                <div className={`h-1.5 flex-1 rounded-full ${session.step === 'SCAN_PRODUCT' ? 'bg-blue-600' : 'bg-blue-200'}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${session.step === 'SCAN_LOCATION' ? 'bg-green-500' : (session.step === 'INPUT_DETAILS' ? 'bg-blue-600' : 'bg-slate-200')}`}/>
                <div className={`h-1.5 flex-1 rounded-full ${session.step === 'INPUT_DETAILS' ? 'bg-orange-500' : 'bg-slate-200'}`}/>
            </div>

            <Card className="shadow-sm border-slate-200 bg-white min-h-[400px]">
                <CardContent className="p-4">
                    {session.step === 'SCAN_PRODUCT' && renderProductList()}
                    {session.step === 'SCAN_LOCATION' && renderScanLocation()}
                    {session.step === 'INPUT_DETAILS' && renderInputDetails()}
                </CardContent>
            </Card>

            {session.step !== 'INPUT_DETAILS' && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t z-20">
                    <div className="max-w-md mx-auto flex gap-2">
                        <Input
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                            placeholder={session.step === 'SCAN_PRODUCT' ? "Quét mã SP..." : "Quét mã Kệ..."}
                            className="h-12"
                        />
                        <ScannerButton
                            onScanResult={(val) => handleScan(val)}
                            className="h-12 w-14 bg-slate-800 text-white rounded shrink-0 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin"/> : <ScanLine/>}
                        </ScannerButton>
                    </div>
                </div>
            )}
            <Toaster />
        </div>
    );
}