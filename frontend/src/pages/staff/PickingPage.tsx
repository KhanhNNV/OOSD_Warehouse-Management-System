// src/pages/PickingPage.tsx
import React, { useState, useEffect } from "react";
import { usePickingScanner } from "@/hooks/usePickingScanner";
import { pickingService } from "@/services/picking.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, MapPin, Search, Trash2, Edit, Save, ArrowLeft, X, Loader2, Package, ScanLine } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";

// Cấu hình Stage mặc định
const DEFAULT_STAGE = {
    id: 50,
    code: "STAGE_02",
    locationType: "STAGE_LOC"
};

export default function PickingPage() {
    const { toast } = useToast();
    const navigate = useNavigate();

    const {
        currentStage, setCurrentStage,
        pickedItems, setPickedItems,
        handleScan, isLoading,
        session, setSession, confirmSession
    } = usePickingScanner();

    const [manualCode, setManualCode] = useState("");
    const [tempQty, setTempQty] = useState("");

    // --- 1. TỰ ĐỘNG SET STAGE KHI VÀO TRANG ---
    useEffect(() => {
        // Luôn gán Stage là "STAGE" mặc định, không cần quét
        setCurrentStage(DEFAULT_STAGE);
    }, [setCurrentStage]);

    // Khi mở Modal -> Set số lượng mặc định
    useEffect(() => {
        if (session.mode && session.item) {
            setTempQty(session.mode === 'EDIT' ? session.item.inputQty.toString() : "");
        }
    }, [session.mode, session.item]);

    // Xử lý nhập tay
    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        // Vì Stage đã có sẵn, hàm này sẽ luôn hiểu là quét sản phẩm
        handleScan(manualCode);
        setManualCode("");
    };

    // Xử lý khi dùng Camera
    const handleCameraScan = (code: string) => {
        if (code) {
            handleScan(code);
        }
    };

    // Xử lý nút Lưu trong Modal
    const handleSaveQty = () => {
        const q = parseInt(tempQty);
        if (isNaN(q) || q <= 0) {
            toast({
                title: "Lỗi nhập liệu",
                description: "Số lượng phải lớn hơn 0",
                variant: "destructive",
            });
            return;
        }
        confirmSession(q);
    };

    // Gửi dữ liệu
    const handleSubmitAll = async () => {
        if (pickedItems.length === 0) return;

        toast({
            title: "Đang xử lý...",
            description: "Đang gửi dữ liệu lên hệ thống",
        });

        try {
            let successCount = 0;
            for (const item of pickedItems) {
                await pickingService.submitPick({
                    productId: item.productId,
                    quantity: item.inputQty,
                    stageLocationId: item.stageLocationId // Backend sẽ nhận ID của Stage mặc định
                });
                successCount++;
            }

            toast({
                title: "Thành công!",
                description: `Đã lấy thành công ${successCount} mặt hàng!`,
                variant: "default",
                className: "bg-green-600 text-white border-none"
            });
            setPickedItems([]);
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra";
            toast({
                title: "Lỗi hệ thống",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="p-4 max-w-5xl mx-auto space-y-4 pb-32 min-h-screen bg-slate-50 relative">
            {/* --- HEADER --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5"/>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold flex items-center gap-2">
                            <ShoppingCart className="w-6 h-6 text-blue-600"/> Picking (Lấy hàng)
                        </h1>
                        {/* Hiển thị Stage tĩnh (chỉ để thông báo) */}
                        <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <MapPin className="w-3 h-3 text-green-600"/>
                            Khu vực: <span className="font-bold text-slate-700">STAGE</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- INPUT BAR & SCANNER --- */}
            <div className="flex gap-2 sticky top-2 z-10 bg-slate-50 pb-2 pt-1">
                <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                    placeholder="Quét mã sản phẩm..." // Luôn là quét sản phẩm
                    className="h-12 text-lg shadow-lg border-blue-200 focus-visible:ring-blue-500 bg-white"
                    autoFocus
                />

                <Button size="icon" className="h-12 w-12 bg-blue-600 hover:bg-blue-700 shadow-lg shrink-0" onClick={handleManualSubmit}>
                    {isLoading ? <Loader2 className="animate-spin"/> : <Search/>}
                </Button>

                {/* NÚT CAMERA */}
                <div className="shrink-0">
                    <ScannerButton
                        onScanResult={handleCameraScan}
                        className="h-12 w-12 p-0 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white shadow-lg rounded-md"
                    >
                        <ScanLine className="w-6 h-6" />
                    </ScannerButton>
                </div>
            </div>

            {/* --- LIST ITEMS --- */}
            <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-slate-100">
                            <TableRow>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead className="text-center w-[80px]">SL</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pickedItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-40 text-center text-slate-400">
                                        <Package className="w-10 h-10 mx-auto mb-2 opacity-20"/>
                                        Mời quét sản phẩm để thêm vào danh sách
                                    </TableCell>
                                </TableRow>
                            ) : (
                                pickedItems.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="font-bold text-slate-800">{item.productName}</div>
                                            <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                                <span className="bg-slate-100 px-1 rounded border">{item.barcode}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold text-lg">{item.inputQty}</TableCell>
                                        <TableCell>
                                            <div className="flex justify-end gap-1">
                                                <Button variant="ghost" size="icon" className="text-blue-500 h-8 w-8"
                                                        onClick={() => setSession({mode: 'EDIT', item, index: idx})}>
                                                    <Edit className="w-4 h-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-red-500 h-8 w-8"
                                                        onClick={() => setPickedItems(l => l.filter((_, i) => i !== idx))}>
                                                    <Trash2 className="w-4 h-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* --- FOOTER --- */}
            {pickedItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-5px_10px_rgba(0,0,0,0.05)] z-20">
                    <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Tổng số lượng</p>
                            <p className="text-2xl font-bold text-blue-600">{pickedItems.reduce((a,b)=>a+b.inputQty, 0)}</p>
                        </div>
                        <Button className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-lg font-bold shadow-lg" onClick={handleSubmitAll}>
                            <Save className="w-5 h-5 mr-2"/> Hoàn tất
                        </Button>
                    </div>
                </div>
            )}

            {/* --- MODAL NHẬP SỐ LƯỢNG (GIỮ NGUYÊN) --- */}
            {session.mode && session.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold">{session.mode === 'ADD' ? 'Thêm hàng' : 'Cập nhật'}</h3>
                            <Button variant="ghost" size="icon" onClick={() => setSession({mode: null, item: null})}>
                                <X className="w-5 h-5"/>
                            </Button>
                        </div>
                        <div className="p-6 text-center space-y-4">
                            <div>
                                <h4 className="font-bold text-lg line-clamp-2">{session.item.productName}</h4>
                                <p className="text-slate-500 text-sm">{session.item.barcode}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase">Số lượng lấy</label>
                                <Input
                                    type="number"
                                    className="text-center text-5xl font-bold h-20 text-blue-600 mt-2"
                                    value={tempQty}
                                    onChange={e => setTempQty(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveQty()}
                                />
                            </div>
                            <Button className="w-full h-12 text-lg font-bold bg-blue-600" onClick={handleSaveQty}>
                                Xác nhận
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}