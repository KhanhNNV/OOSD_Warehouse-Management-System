import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useRelocateScanning } from "@/hooks/useRelocateScanning"; // Import Hook
import { ScannerButton } from "@/components/scanner/ScannerButton"; // Component sẵn có của bạn
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    ArrowLeft, ArrowRight, Box, CheckCircle,
    History, MapPin, RefreshCcw, Search, X
} from "lucide-react";
import { format } from "date-fns"; // Thư viện format date (cần cài thêm nếu chưa có)

export default function RelocateInventory() {
    const navigate = useNavigate();
    const manualInputRef = useRef<HTMLInputElement>(null);

    const {
        fromLoc, setFromLoc,
        toLoc, setToLoc,
        quantity, setQuantity,
        barcode,
        history,
        activeStep, setActiveStep,
        isQtyModalOpen, setIsQtyModalOpen,
        isLoading,
        handleScan,
        handleSubmitRelocate,
        resetProcess
    } = useRelocateScanning();

    // Xử lý khi nhấn Enter ở ô input manual
    const handleManualSubmit = () => {
        if (manualInputRef.current && manualInputRef.current.value) {
            handleScan(manualInputRef.current.value);
            manualInputRef.current.value = ""; // Clear input sau khi xử lý
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-6 pb-32">
            {/* --- HEADER --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Di chuyển hàng (Relocate)</h2>
                        <p className="text-xs text-slate-500">Chuyển kho nội bộ</p>
                    </div>
                </div>
                <Button variant="ghost" size="sm" onClick={resetProcess} className="text-slate-500 hover:text-red-500">
                    <RefreshCcw className="w-4 h-4 mr-1"/> Reset
                </Button>
            </div>

            {/* --- CẤU HÌNH VỊ TRÍ (STEP 1 & 2) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* FROM LOCATION */}
                <Card className={`border-2 transition-all ${activeStep === 'SCAN_FROM' ? 'border-blue-500 shadow-md bg-blue-50/20' : 'border-transparent shadow-sm'}`}>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-red-500"/> Vị trí NGUỒN (Từ đâu?)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex gap-2">
                            <Input
                                value={fromLoc}
                                onChange={(e) => setFromLoc(e.target.value.toUpperCase())}
                                placeholder="Quét vị trí nguồn..."
                                className="font-bold text-lg uppercase"
                                autoFocus={activeStep === 'SCAN_FROM'}
                                onKeyDown={(e) => e.key === "Enter" && handleScan(fromLoc)}
                            />
                            {activeStep === 'SCAN_FROM' && <div className="animate-pulse w-3 h-3 rounded-full bg-blue-500 absolute right-8 top-12" />}
                        </div>
                    </CardContent>
                </Card>

                {/* TO LOCATION */}
                <Card className={`border-2 transition-all ${activeStep === 'SCAN_TO' ? 'border-green-500 shadow-md bg-green-50/20' : 'border-transparent shadow-sm'}`}>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-green-600"/> Vị trí ĐÍCH (Đến đâu?)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                        <div className="flex gap-2">
                            <Input
                                value={toLoc}
                                onChange={(e) => setToLoc(e.target.value.toUpperCase())}
                                placeholder="Quét vị trí đích..."
                                className="font-bold text-lg uppercase"
                                disabled={!fromLoc} // Phải có nguồn mới nhập đích
                                autoFocus={activeStep === 'SCAN_TO'}
                                onKeyDown={(e) => e.key === "Enter" && handleScan(toLoc)}
                            />
                            {activeStep === 'SCAN_TO' && <div className="animate-pulse w-3 h-3 rounded-full bg-green-500 absolute right-8 top-12" />}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* --- MAIN SCANNER AREA (STEP 3) --- */}
            <Card className={`border-2 border-dashed ${activeStep === 'SCAN_PRODUCT' ? 'border-blue-300 bg-white' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="bg-slate-100 p-4 rounded-full">
                        <Box className={`w-10 h-10 ${activeStep === 'SCAN_PRODUCT' ? 'text-blue-600' : 'text-slate-400'}`} />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Quét sản phẩm</h3>
                        <p className="text-sm text-slate-500">
                            {activeStep === 'SCAN_PRODUCT'
                                ? "Hệ thống đã sẵn sàng. Hãy quét mã vạch sản phẩm."
                                : "Vui lòng chọn vị trí Nguồn và Đích trước."}
                        </p>
                    </div>

                    <div className="flex gap-2 w-full max-w-md">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                            <Input
                                ref={manualInputRef}
                                placeholder={activeStep === 'SCAN_PRODUCT' ? "Nhập barcode tại đây..." : "Đang chờ..."}
                                className="pl-9"
                                disabled={activeStep !== 'SCAN_PRODUCT'}
                                onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                            />
                        </div>
                        {/* REUSE SCANNER BUTTON */}
                        <ScannerButton
                            onScanResult={handleScan}
                            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[120px]"
                            disabled={activeStep !== 'SCAN_PRODUCT' && activeStep !== 'SCAN_FROM' && activeStep !== 'SCAN_TO'}
                        >
                            Camera
                        </ScannerButton>
                    </div>
                </CardContent>
            </Card>

            {/* --- HISTORY LOG --- */}
            <Card className="shadow-sm">
                <CardHeader className="bg-slate-50 py-3 border-b flex flex-row items-center gap-2">
                    <History className="w-4 h-4 text-slate-500" />
                    <CardTitle className="text-base">Lịch sử vừa chuyển</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Barcode</TableHead>
                                <TableHead>Từ - Đến</TableHead>
                                <TableHead className="text-center">SL</TableHead>
                                <TableHead className="text-right">Thời gian</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {history.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-slate-400 py-8">Chưa có giao dịch nào</TableCell>
                                </TableRow>
                            ) : (
                                history.map((log) => (
                                    <TableRow key={log.id} className="animate-in slide-in-from-top-2">
                                        <TableCell className="font-medium">{log.barcode}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1 text-xs">
                                                <span className="bg-slate-100 px-1 rounded">{log.from}</span>
                                                <ArrowRight className="w-3 h-3 text-slate-400"/>
                                                <span className="bg-green-100 text-green-700 px-1 rounded font-bold">{log.to}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-bold">{log.quantity}</TableCell>
                                        <TableCell className="text-right text-xs text-slate-500">
                                            {format(log.timestamp, "HH:mm:ss")}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* --- MODAL CONFIRM QUANTITY --- */}
            {isQtyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95">
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-slate-800">Xác nhận di chuyển</h3>
                            <Button variant="ghost" size="icon" onClick={() => setIsQtyModalOpen(false)}>
                                <X className="w-5 h-5 text-slate-400"/>
                            </Button>
                        </div>
                        <div className="p-6 space-y-6 text-center">
                            <div>
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Đang chuyển</div>
                                <h4 className="font-bold text-xl text-blue-600 break-all">{barcode}</h4>
                                <div className="flex justify-center items-center gap-2 mt-2 text-sm">
                                    <span className="bg-slate-100 px-2 py-1 rounded">{fromLoc}</span>
                                    <ArrowRight className="w-4 h-4 text-slate-400"/>
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded font-bold">{toLoc}</span>
                                </div>
                            </div>

                            <div>
                                <Label className="mb-2 block text-slate-500">Số lượng</Label>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="text-4xl h-16 text-center font-bold text-slate-800 bg-slate-50"
                                    autoFocus
                                    onKeyDown={(e) => e.key === "Enter" && handleSubmitRelocate()}
                                />
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700"
                                onClick={handleSubmitRelocate}
                                disabled={isLoading}
                            >
                                {isLoading ? "Đang xử lý..." : "Xác nhận chuyển"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}