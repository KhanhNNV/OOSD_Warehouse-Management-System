import React, { useState, useEffect } from "react";
import { usePutAwayScanner } from "@/hooks/usePutAwayScanner";
import { pickingService } from "@/services/picking.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ArrowLeft, Loader2, ScanLine, Box,
    Calendar, MapPin, RefreshCw, ChevronRight, LayoutGrid
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Label } from "@/components/ui/label";

export default function PutAwayPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { session, setSession, isLoading, handleScan, confirmDetails, resetSession } = usePutAwayScanner();
    const [manualCode, setManualCode] = useState("");

    // --- STATE CHO DANH SÁCH GỢI Ý ---
    const [suggestedShelves, setSuggestedShelves] = useState<string[]>([]);
    const [loadingShelves, setLoadingShelves] = useState(false);

    // Form data
    const [formData, setFormData] = useState({ qty: "1", mfg: "", exp: "" });

    // --- EFFECT: Lấy danh sách kệ trống NGAY KHI VÀO TRANG ---
    useEffect(() => {
        fetchAvailableShelves();
    }, []);

    const fetchAvailableShelves = async () => {
        setLoadingShelves(true);
        try {
            const data = await pickingService.getAvailableShelves();
            setSuggestedShelves(data);
        } catch (error) {
            console.error("Lỗi lấy danh sách kệ:", error);
        } finally {
            setLoadingShelves(false);
        }
    };

    const handleManualSubmit = () => {
        if (manualCode) {
            handleScan(manualCode);
            setManualCode("");
        }
    };

    const handleConfirmStep2 = () => {
        confirmDetails(parseInt(formData.qty), formData.mfg, formData.exp);
    };

    // Click chọn shelf chỉ hoạt động ở bước 3 (quét vị trí)
    // Ở bước 1 chỉ để xem tham khảo
    const handleSelectSuggestion = (shelfCode: string) => {
        if (session.step === 'SCAN_LOCATION') {
            handleScan(shelfCode);
            toast({
                title: "Đã chọn vị trí",
                description: `Đang xử lý cất hàng vào: ${shelfCode}`,
                className: "bg-blue-600 text-white"
            });
        } else {
            toast({
                title: "Thông tin vị trí",
                description: `Vị trí ${shelfCode} đang trống. Hãy quét sản phẩm trước!`,
            });
        }
    };

    // --- COMPONENT CON: HIỂN THỊ DANH SÁCH KỆ ---
    // Tách ra để dùng lại ở cả Bước 1 và Bước 3
    const AvailableShelvesList = ({ clickAction = false }: { clickAction?: boolean }) => (
        <div className="border rounded-xl overflow-hidden bg-white shadow-sm mb-4">
            <div className="flex items-center justify-between p-3 bg-slate-100 border-b">
                <h4 className="font-bold text-sm text-slate-700 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-green-600"/>
                    Các kệ đang còn trống
                </h4>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={fetchAvailableShelves} disabled={loadingShelves}>
                    <RefreshCw className={`w-3 h-3 ${loadingShelves ? 'animate-spin' : ''}`} />
                </Button>
            </div>

            <ScrollArea className="h-[140px] p-3 bg-slate-50/50">
                {loadingShelves ? (
                    <div className="flex items-center justify-center h-20 text-xs text-slate-400">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin"/> Đang tải dữ liệu...
                    </div>
                ) : suggestedShelves.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm">
                        Không tìm thấy kệ trống.
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {suggestedShelves.map((shelf) => (
                            <div
                                key={shelf}
                                onClick={() => handleSelectSuggestion(shelf)}
                                className={`
                                    rounded-lg p-2 text-center transition-all border shadow-sm
                                    font-mono font-bold text-sm
                                    ${clickAction
                                    ? 'cursor-pointer bg-white border-slate-200 hover:border-green-500 hover:bg-green-50 hover:text-green-700 active:scale-95'
                                    : 'cursor-default bg-slate-200 text-slate-500 border-transparent opacity-80'
                                }
                                `}
                            >
                                {shelf}
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
            {!clickAction && (
                <div className="p-2 bg-yellow-50 text-[10px] text-yellow-700 text-center border-t border-yellow-100">
                    * Tham khảo vị trí để di chuyển trước khi quét hàng
                </div>
            )}
        </div>
    );

    // Render nội dung chính
    const renderContent = () => {
        // --- BƯỚC 1: HIỆN LIST TRƯỚC -> RỒI MỚI QUÉT SP ---
        if (session.step === 'SCAN_PRODUCT') {
            return (
                <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                    {/* 1. HIỆN LIST NGAY ĐẦU TIÊN */}
                    <AvailableShelvesList clickAction={false} />

                    {/* 2. KHU VỰC QUÉT SẢN PHẨM */}
                    <div className="text-center pt-2 border-t border-dashed">
                        <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-blue-100 animate-pulse">
                            <Box className="w-10 h-10 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800">Bước 1: Quét Sản Phẩm</h2>
                        <p className="text-slate-500 text-sm">Quét mã vạch sản phẩm trên tay bạn</p>
                    </div>
                </div>
            );
        }

        // --- BƯỚC 2: NHẬP SỐ LƯỢNG & DATE ---
        if (session.step === 'INPUT_DETAILS') {
            return (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h3 className="font-bold text-lg text-blue-700">{session.product?.productName}</h3>
                        <p className="text-sm text-slate-500 font-mono">{session.product?.barcode}</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <Label className="font-bold text-slate-700">Số lượng cất thực tế</Label>
                            <Input
                                type="number"
                                className="text-lg font-bold h-12 mt-1 border-blue-200 focus-visible:ring-blue-500"
                                value={formData.qty}
                                onChange={e => setFormData({ ...formData, qty: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs font-semibold text-slate-500">Ngày SX (MFG)</Label>
                                <Input
                                    type="date"
                                    className="mt-1"
                                    value={formData.mfg}
                                    onChange={e => setFormData({ ...formData, mfg: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-semibold text-slate-500">Hạn SD (EXP)</Label>
                                <Input
                                    type="date"
                                    className="mt-1"
                                    value={formData.exp}
                                    onChange={e => setFormData({ ...formData, exp: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="w-1/3" onClick={resetSession}>Hủy</Button>
                        <Button className="w-2/3 bg-blue-600 hover:bg-blue-700 font-bold" onClick={handleConfirmStep2}>
                            Tiếp tục <ChevronRight className="w-4 h-4 ml-1"/>
                        </Button>
                    </div>
                </div>
            );
        }

        // --- BƯỚC 3: QUÉT VỊ TRÍ (Cũng hiện list để chọn nhanh) ---
        if (session.step === 'SCAN_LOCATION') {
            return (
                <div className="space-y-5 animate-in slide-in-from-right duration-300">
                    <div className="text-center">
                        <h2 className="text-xl font-bold text-slate-800">Bước 3: Chọn Vị Trí</h2>
                        <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            Đang giữ: {session.quantity} x {session.product?.productName}
                        </div>
                    </div>

                    {/* HIỆN LIST LẦN NỮA NHƯNG CHO PHÉP CLICK CHỌN */}
                    <AvailableShelvesList clickAction={true} />

                    <div className="text-center text-slate-500 text-sm">
                        <p>Hoặc quét mã vạch trên kệ</p>
                    </div>

                    <Button variant="link" className="text-red-500 text-sm w-full" onClick={() => setSession(prev => ({ ...prev, step: 'INPUT_DETAILS' }))}>
                        Quay lại sửa số lượng
                    </Button>
                </div>
            );
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen bg-slate-50 pb-24">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4 sticky top-0 bg-slate-50 pt-2 pb-2 z-10">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-white shadow-sm border-slate-200">
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <h1 className="text-xl font-bold text-slate-800">Put Away</h1>
            </div>

            {/* Main Card */}
            <Card className="shadow-sm border border-slate-200 bg-white">
                <CardContent className="p-5">
                    {/* Stepper đơn giản */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <div className={`h-2 flex-1 rounded-full ${session.step === 'SCAN_PRODUCT' ? 'bg-blue-600' : 'bg-blue-200'}`} />
                        <div className={`h-2 flex-1 rounded-full ${['INPUT_DETAILS', 'SCAN_LOCATION'].includes(session.step) ? 'bg-blue-600' : 'bg-slate-100'}`} />
                        <div className={`h-2 flex-1 rounded-full ${session.step === 'SCAN_LOCATION' ? 'bg-orange-500' : 'bg-slate-100'}`} />
                    </div>

                    {renderContent()}
                </CardContent>
            </Card>

            {/* Input & Scanner (Chỉ hiện ở Bước 1 và 3) */}
            {session.step !== 'INPUT_DETAILS' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-lg z-20">
                    <div className="max-w-md mx-auto flex gap-3">
                        <Input
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                            placeholder={session.step === 'SCAN_PRODUCT' ? "Quét mã SP..." : "Quét mã KỆ..."}
                            className="h-12 text-lg"
                            autoFocus
                        />
                        <ScannerButton
                            onScanResult={(code) => code && handleScan(code)}
                            className="h-12 w-14 bg-slate-800 text-white rounded-lg shrink-0 flex items-center justify-center"
                        >
                            {isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : <ScanLine className="w-6 h-6" />}
                        </ScannerButton>
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}