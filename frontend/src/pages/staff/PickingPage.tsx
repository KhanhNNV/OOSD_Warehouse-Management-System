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
import {
    ShoppingCart, MapPin, Search, Trash2, Edit, Save,
    ArrowLeft, X, Loader2, Package, ScanLine
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { LocationResponse } from "@/types/picking";


// --- QUAN TRỌNG: Import từ components/ui thay vì radix-ui trực tiếp để có style ---
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
const STORAGE_REF_ID = "LATEST_PNP_REF_ID";

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

    const [stageList, setStageList] = useState<LocationResponse[]>([]);
    const [isLoadingStages, setIsLoadingStages] = useState(false);

    // --- 1. TỰ ĐỘNG SET STAGE KHI VÀO TRANG ---
    useEffect(() => {
        const fetchStages = async () => {
            setIsLoadingStages(true);
            try {
                const stages = await pickingService.getStageLocations();
                setStageList(stages);

                if (!currentStage && stages.length > 0) {
                    setCurrentStage(stages[0]);
                }
            } catch (error) {
                toast({
                    title: "Lỗi kết nối",
                    description: "Không thể tải danh sách khu vực Stage",
                    variant: "destructive"
                });
            } finally {
                setIsLoadingStages(false);
            }
        };
        fetchStages();
    }, []);

    const handleStageChange = (stageIdStr: string) => {
        const stageId = parseInt(stageIdStr);
        const newStage = stageList.find(s => s.id === stageId);

        if (!newStage) return;

        if (pickedItems.length > 0 && currentStage?.id !== newStage.id) {
            const confirmChange = window.confirm(
                "Đổi khu vực sẽ xóa danh sách hàng hiện tại. Bạn có chắc không?"
            );
            if (!confirmChange) return;
            setPickedItems([]);
        }

        setCurrentStage(newStage);
        toast({
            title: "Đã đổi khu vực",
            description: `Khu vực làm việc: ${newStage.code}`,
            className: "bg-green-600 text-white border-none"
        });
    };

    // Khi mở Modal -> Set số lượng mặc định
    useEffect(() => {
        if (session.mode && session.item) {
            setTempQty(session.mode === 'EDIT' ? session.item.inputQty.toString() : "");
        }
    }, [session.mode, session.item]);


    const handleManualSubmit = () => {
        if (!manualCode.trim()) return;
        if (!currentStage) {
            toast({
                title: "Chưa chọn khu vực",
                description: "Vui lòng chọn STAGE ở góc trên trước khi quét hàng!",
                variant: "destructive"
            });
            return;
        }
        handleScan(manualCode);
        setManualCode("");
    };

    const handleCameraScan = (code: string) => {
        if (!currentStage) {
            toast({
                title: "Chưa chọn khu vực",
                description: "Vui lòng chọn STAGE trước!",
                variant: "destructive"
            });
            return;
        }
        if (code) handleScan(code);
    };

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

    const handleSubmitAll = async () => {
        if (pickedItems.length === 0) return;

        toast({
            title: "Đang xử lý...",
            description: "Đang gửi dữ liệu lên hệ thống",
        });

        try {
            const payload = pickedItems.map(item => ({
                productId: item.productId,
                quantity: item.inputQty,
                stageLocationId: item.stageLocationId
            }));

            // --- GỌI API 1 LẦN DUY NHẤT ---
            const res = await pickingService.submitPick(payload);

            // Backend trả về refId duy nhất
            const refId = res.data?.data || res.data; // Tùy format response của bạn

            if (refId) {
                localStorage.setItem(STORAGE_REF_ID, refId);
                console.log("Đã lưu RefId chung:", refId);
            }

            toast({
                title: "Hoàn tất Picking!",
                description: "Đang chuyển sang bước Cất hàng (Putaway)...",
                className: "bg-green-600 text-white"
            });

            setTimeout(() => {
                navigate('/staff/put-away');
            }, 1500);
            setPickedItems([]);
        } catch (error) {
            console.error(error);
            const errorMessage = error.response?.data?.details || "Có lỗi xảy ra";
            toast({
                title: "Lỗi hệ thống",
                description: errorMessage,
                variant: "destructive"
            });
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-32">
            {/* --- HEADER --- */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto p-3">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                        {/* Title & Back Button */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="-ml-2">
                                <ArrowLeft className="w-5 h-5 text-slate-600"/>
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <ShoppingCart className="w-5 h-5 text-blue-600"/>
                                    Picking (Lấy hàng)
                                </h1>
                            </div>
                        </div>

                        {/* --- SELECTOR CHỌN STAGE (STYLE MỚI) --- */}
                        <div className="w-full md:w-[220px]">
                            <Select
                                value={currentStage?.id.toString()}
                                onValueChange={handleStageChange}
                                disabled={isLoadingStages}
                            >
                                <SelectTrigger
                                    className="w-full h-11 bg-white border-slate-300 shadow-sm focus:ring-blue-500 focus:ring-2 font-medium"
                                >
                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                        {/* Icon Pin giống trong hình */}
                                        <MapPin className="w-4 h-4 text-green-600 shrink-0 fill-current" />
                                        <SelectValue placeholder="Chọn vị trí STAGE..." />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="max-h-[300px]">
                                    {stageList.length === 0 ? (
                                        <div className="p-3 text-sm text-slate-500 text-center">Đang tải dữ liệu...</div>
                                    ) : (
                                        stageList.map((stage) => (
                                            <SelectItem key={stage.id} value={stage.id.toString()} className="py-3 cursor-pointer">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800">{stage.code}</span>
                                                    <span className="text-[10px] text-slate-400 uppercase">Khu vực lấy hàng</span>
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* --- INPUT BAR & SCANNER (Dính liền Header) --- */}
                    <div className="flex gap-2 mt-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                value={manualCode}
                                onChange={(e) => setManualCode(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                                placeholder={currentStage ? "Quét/Nhập mã sản phẩm..." : "Chọn Stage ở trên trước 👆"}
                                disabled={!currentStage}
                                className="h-12 pl-10 text-lg border-slate-300 focus-visible:ring-blue-500 bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
                                autoFocus
                            />
                        </div>

                        <div className="shrink-0">
                            <ScannerButton
                                onScanResult={handleCameraScan}
                                className={`h-12 w-12 p-0 flex items-center justify-center shadow-md rounded-lg transition-colors ${!currentStage ? 'bg-slate-300 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900 text-white'}`}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin"/> : <ScanLine className="w-6 h-6" />}
                            </ScannerButton>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LIST ITEMS --- */}
            <div className="max-w-5xl mx-auto p-3">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="w-[60%]">Sản phẩm</TableHead>
                                    <TableHead className="text-center w-[20%]">SL</TableHead>
                                    <TableHead className="w-[20%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {!currentStage ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <MapPin className="w-12 h-12 text-slate-200"/>
                                                <p>Vui lòng chọn khu vực STAGE để bắt đầu</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : pickedItems.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="w-12 h-12 text-slate-200"/>
                                                <p>Danh sách trống</p>
                                                <p className="text-xs">Quét mã sản phẩm để thêm vào danh sách</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pickedItems.map((item, idx) => (
                                        <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="py-4">
                                                <div className="font-bold text-slate-800 text-base">{item.productName}</div>
                                                <div className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                                                    <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-600">
                                                        {item.barcode}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold rounded-full text-lg border border-blue-100">
                                                    {item.inputQty}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                            onClick={() => setSession({mode: 'EDIT', item, index: idx})}>
                                                        <Edit className="w-4 h-4"/>
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-600 hover:bg-red-50"
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
            </div>

            {/* --- FOOTER --- */}
            {pickedItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 safe-area-bottom">
                    <div className="max-w-5xl mx-auto p-4 flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tổng số lượng</span>
                            <span className="text-2xl font-black text-slate-800 leading-none">
                                {pickedItems.reduce((a,b)=>a+b.inputQty, 0)} <span className="text-sm font-normal text-slate-500">sp</span>
                            </span>
                        </div>
                        <Button
                            className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold shadow-lg shadow-blue-200 rounded-xl"
                            onClick={handleSubmitAll}
                        >
                            <Save className="w-5 h-5 mr-2"/> Hoàn tất
                        </Button>
                    </div>
                </div>
            )}

            {/* --- MODAL (GIỮ NGUYÊN) --- */}
            {session.mode && session.item && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">{session.mode === 'ADD' ? 'Thêm hàng' : 'Cập nhật số lượng'}</h3>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200" onClick={() => setSession({mode: null, item: null})}>
                                <X className="w-5 h-5 text-slate-500"/>
                            </Button>
                        </div>
                        <div className="p-6 text-center space-y-5">
                            <div>
                                <h4 className="font-bold text-lg leading-tight text-slate-800 mb-1">{session.item.productName}</h4>
                                <span className="inline-block bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-mono border">
                                    {session.item.barcode}
                                </span>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-wide block mb-2">Số lượng lấy</label>
                                <Input
                                    type="number"
                                    className="text-center text-5xl font-black h-20 text-blue-600 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none placeholder:text-blue-200"
                                    value={tempQty}
                                    onChange={e => setTempQty(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveQty()}
                                />
                            </div>

                            <Button className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100" onClick={handleSaveQty}>
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