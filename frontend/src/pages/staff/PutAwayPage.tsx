import React, { useState, useEffect } from "react";
import { usePutAwayScanner } from "@/hooks/usePutAwayScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ArrowLeft,
    Loader2,
    ScanLine,
    RefreshCw,
    PackageOpen,
    MapPin,
    CheckCircle2,
    Scan,
    ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function PutAwayPage() {
    const navigate = useNavigate();
    const { toast } = useToast();

    // 1. Hook (Đã cập nhật theo logic mới)
    const {
        session,
        setSession,
        transitList,
        suggestedLocation, // ✅ Thay suggestedShelves bằng suggestedLocation
        scannedShelf,
        isLoading,
        handleScan,
        submitPutAway,
        refreshData,
    } = usePutAwayScanner();

    // 2. Local State
    const [manualCode, setManualCode] = useState("");
    const [formData, setFormData] = useState({ qty: "1", exp: "" });

    // State cho checkbox "Mark Location Full"
    const [isLocationFull, setIsLocationFull] = useState(false);

    // Sync dữ liệu vào Form
    useEffect(() => {
        if (session.step === "INPUT_DETAILS" && session.selectedItem) {
            setFormData({
                qty: session.selectedItem.quantity.toString(),
                exp: session.expDate || "",
            });
            // Reset checkbox khi mở form
            setIsLocationFull(false);
        }
    }, [session.step, session.selectedItem]);

    // Submit Handler
    const handleFinalSubmit = async () => {
        const qty = parseInt(formData.qty);

        // Validation
        if (!qty || qty <= 0) {
            toast({ variant: "destructive", description: "Số lượng không hợp lệ" });
            return;
        }

        if (session.selectedItem && qty > session.selectedItem.quantity) {
            toast({
                variant: "destructive",
                description: "Số lượng nhập lớn hơn số lượng đang giữ",
            });
            return;
        }

        // Truyền isLocationFull vào submitPutAway
        const success = await submitPutAway(qty, formData.exp, isLocationFull);

        if (success) {
            setFormData({ qty: "1", exp: "" });
            setIsLocationFull(false);
        }
    };

    const handleManualSubmit = () => {
        if (manualCode) {
            handleScan(manualCode);
            setManualCode("");
        }
    };

    // --- RENDER HELPERS ---

    // 1. Danh sách sản phẩm (Bỏ hiển thị kệ gợi ý vì chưa scan)
    const renderProductList = () => (
        <div className="space-y-4 animate-in slide-in-from-left">
            <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-500 uppercase">
          Hàng đang chờ cất ({transitList.length})
        </span>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={refreshData}
                >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
            </div>
            <ScrollArea className="h-[400px] pr-2">
                {transitList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-2">
                        <PackageOpen className="w-8 h-8 opacity-50" />
                        <span className="text-xs">Không có hàng chờ</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {transitList.map((item) => (
                            <div
                                key={item.productId}
                                onClick={() => handleScan(item.barcode)}
                                className="bg-white p-3 rounded-lg border shadow-sm cursor-pointer hover:border-blue-400 transition-colors group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <div className="font-bold text-sm text-slate-800 group-hover:text-blue-700">
                                            {item.name}
                                        </div>
                                        <div className="text-[14px] text-slate-500 font-mono mt-0.5">
                                            {item.barcode}
                                        </div>
                                    </div>
                                    <Badge className="bg-blue-100 text-blue-700">
                                        SL: {item.quantity}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 italic">
                                    <ScanLine className="w-3 h-3" />
                                    Quét sản phẩm để lấy vị trí gợi ý
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ScrollArea>
        </div>
    );

    // 2. Màn hình quét vị trí (UPDATE: Hiển thị 1 vị trí gợi ý to rõ)
    const renderScanLocation = () => (
        <div className="space-y-4 animate-in slide-in-from-right">
            {/* Thông tin sản phẩm đang chọn */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-900">
                    {session.selectedItem?.productName}
                </h3>
                <div className="text-xs text-blue-600 mt-1 flex gap-2">
                    <span>SKU: {session.selectedItem?.sku}</span>
                    <span>|</span>
                    <span>Barcode: {session.selectedItem?.barcode}</span>
                </div>
            </div>

            <div className="flex justify-center py-2">
                <ArrowRight className="w-6 h-6 text-slate-300 animate-bounce mt-2" />
            </div>

            {/* Hiển thị vị trí gợi ý TO RÕ */}
            <div className="text-center py-4 bg-white rounded-xl border-2 border-dashed border-green-300 shadow-sm">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Vị trí đề xuất
                </div>
                <div className="flex items-center justify-center gap-2 text-green-700">
                    <MapPin className="w-6 h-6" />
                    <span className="text-4xl font-black tracking-tight">{suggestedLocation}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 px-4">
                    Hãy di chuyển đến kệ này và quét mã vị trí để xác nhận
                </p>
            </div>

            <div className="text-center py-4">
                <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-200">
                    <Scan className="w-8 h-8 text-slate-500" />
                </div>
                <p className="text-sm font-medium text-slate-600">Đang chờ quét mã kệ...</p>
            </div>

            <Button
                variant="outline"
                className="w-full text-slate-500"
                onClick={() =>
                    setSession((prev) => ({ ...prev, step: "SCAN_PRODUCT" }))
                }
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Chọn sản phẩm khác
            </Button>
        </div>
    );

    // 3. Màn hình nhập chi tiết (Input Details)
    const renderInputDetails = () => (
        <div className="space-y-4 animate-in slide-in-from-right">
            {/* Location Info */}
            <div className="flex items-center gap-3 text-sm bg-green-50 p-4 rounded-lg border border-green-200 text-green-800 shadow-sm">
                <div className="bg-green-200 p-2 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-700" />
                </div>
                <div>
                    <div className="text-xs uppercase text-green-600 font-semibold">Đã quét vị trí</div>
                    <div className="font-bold text-xl">{scannedShelf}</div>
                </div>
            </div>

            {/* Form Inputs */}
            <div className="space-y-4 bg-white p-1 rounded-lg">
                {/* Số lượng */}
                <div>
                    <Label className="text-slate-600 mb-1.5 block">Số lượng cất</Label>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            className="w-12 h-12 text-lg"
                            onClick={() => {
                                const current = parseInt(formData.qty) || 0;
                                if(current > 1) setFormData({...formData, qty: (current - 1).toString()})
                            }}
                        >-</Button>
                        <Input
                            type="number"
                            value={formData.qty}
                            onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                            className="text-3xl font-bold text-center h-12 flex-1"
                            autoFocus
                        />
                        <Button
                            variant="outline"
                            className="w-12 h-12 text-lg"
                            onClick={() => {
                                const current = parseInt(formData.qty) || 0;
                                setFormData({...formData, qty: (current + 1).toString()})
                            }}
                        >+</Button>
                    </div>
                </div>

                {/* Checkbox "Mark Location Full" */}
                <div className="flex items-start space-x-3 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    <Checkbox
                        id="mark-full"
                        checked={isLocationFull}
                        onCheckedChange={(checked) => setIsLocationFull(checked as boolean)}
                        className="mt-1 border-amber-400 data-[state=checked]:bg-amber-500"
                    />
                    <div className="flex-1">
                        <label
                            htmlFor="mark-full"
                            className="text-sm font-bold text-amber-900 leading-tight cursor-pointer block"
                        >
                            Đánh dấu kệ đã đầy?
                        </label>
                        <p className="text-xs text-amber-700 mt-0.5">
                            Hệ thống sẽ không gợi ý vị trí này cho lần sau.
                        </p>
                    </div>
                </div>

                {/* Hạn SD */}
                <div>
                    <Label className="text-slate-600">Hạn sử dụng (Tùy chọn)</Label>
                    <Input
                        type="date"
                        className="mt-1"
                        value={formData.exp}
                        onChange={(e) => setFormData({ ...formData, exp: e.target.value })}
                    />
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <Button
                    variant="secondary"
                    className="flex-1"
                    disabled={isLoading}
                    onClick={() => {
                        setSession((prev) => ({ ...prev, step: "SCAN_LOCATION" }));
                        setIsLocationFull(false); // Reset checkbox
                    }}
                >
                    Quay lại
                </Button>

                <Button
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                    disabled={isLoading}
                    onClick={handleFinalSubmit}
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                        <PackageOpen className="w-4 h-4 mr-2" />
                    )}
                    Xác nhận cất
                </Button>
            </div>
        </div>
    );

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen bg-slate-50 pb-28">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2 sticky top-0 bg-slate-50 pt-2 pb-2 z-10">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <h1 className="text-lg font-bold text-slate-800">Cất hàng (Put Away)</h1>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-1 mb-4 px-1">
                <div
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        session.step === "SCAN_PRODUCT" ? "bg-blue-600" : "bg-blue-200"
                    }`}
                />
                <div
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        session.step === "SCAN_LOCATION"
                            ? "bg-blue-600"
                            : session.step === "INPUT_DETAILS"
                                ? "bg-blue-400"
                                : "bg-slate-200"
                    }`}
                />
                <div
                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                        session.step === "INPUT_DETAILS" ? "bg-blue-600" : "bg-slate-200"
                    }`}
                />
            </div>

            {/* Main Content Card */}
            <Card className="shadow-sm border-slate-200 bg-white min-h-[420px]">
                <CardContent className="p-4">
                    {session.step === "SCAN_PRODUCT" && renderProductList()}
                    {session.step === "SCAN_LOCATION" && renderScanLocation()}
                    {session.step === "INPUT_DETAILS" && renderInputDetails()}
                </CardContent>
            </Card>

            {/* Scanner Input Area (Ẩn khi đang nhập chi tiết) */}
            {session.step !== "INPUT_DETAILS" && (
                <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <div className="max-w-md mx-auto flex gap-2">
                        <Input
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                            placeholder={
                                session.step === "SCAN_PRODUCT"
                                    ? "Quét mã SP hoặc SKU..."
                                    : "Quét mã vị trí kệ..."
                            }
                            className="h-12 text-base"
                        />
                        <ScannerButton
                            onScanResult={(val) => handleScan(val)}
                            className="h-12 w-14 bg-slate-900 text-white rounded shrink-0 flex items-center justify-center hover:bg-slate-800"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : <ScanLine />}
                        </ScannerButton>
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}