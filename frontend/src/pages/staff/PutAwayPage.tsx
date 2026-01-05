// src/pages/PutAwayPage.tsx
import React, { useState } from "react";
import { usePutAwayScanner } from "@/hooks/usePutAwayScanner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Toaster } from "@/components/ui/toaster";
import { ArrowLeft, Loader2, ScanLine, Box, Calendar, MapPin, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { Label } from "@/components/ui/label";

export default function PutAwayPage() {
    const navigate = useNavigate();
    const { session,setSession, isLoading, handleScan, confirmDetails, resetSession } = usePutAwayScanner();
    const [manualCode, setManualCode] = useState("");

    // State tạm cho form nhập liệu
    const [formData, setFormData] = useState({
        qty: "1",
        mfg: "",
        exp: ""
    });

    const handleManualSubmit = () => {
        if (manualCode) {
            handleScan(manualCode);
            setManualCode("");
        }
    };

    const handleConfirmStep2 = () => {
        confirmDetails(parseInt(formData.qty), formData.mfg, formData.exp);
    };

    // Render nội dung dựa trên Step
    const renderContent = () => {
        // --- BƯỚC 1: QUÉT SẢN PHẨM ---
        if (session.step === 'SCAN_PRODUCT') {
            return (
                <div className="text-center space-y-6 py-10 animate-in fade-in zoom-in duration-300">
                    <div className="bg-blue-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Box className="w-12 h-12 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Bước 1: Quét Sản Phẩm</h2>
                        <p className="text-slate-500">Quét mã vạch sản phẩm cần cất</p>
                    </div>
                </div>
            );
        }

        // --- BƯỚC 2: NHẬP SỐ LƯỢNG & DATE ---
        if (session.step === 'INPUT_DETAILS') {
            return (
                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h3 className="font-bold text-lg text-blue-700">{session.product?.productName}</h3>
                        <p className="text-sm text-slate-500">Mã: {session.product?.barcode}</p>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <Label>Số lượng cất</Label>
                            <Input
                                type="number"
                                className="text-lg font-bold"
                                value={formData.qty}
                                onChange={e => setFormData({...formData, qty: e.target.value})}
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-xs">Ngày SX (MFG)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-8"
                                        value={formData.mfg}
                                        onChange={e => setFormData({...formData, mfg: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs">Hạn SD (EXP)</Label>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        type="date"
                                        className="pl-8"
                                        value={formData.exp}
                                        onChange={e => setFormData({...formData, exp: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <Button variant="outline" className="w-1/3" onClick={resetSession}>Hủy</Button>
                        <Button className="w-2/3 bg-blue-600" onClick={handleConfirmStep2}>Tiếp tục</Button>
                    </div>
                </div>
            );
        }

        // --- BƯỚC 3: QUÉT VỊ TRÍ ---
        if (session.step === 'SCAN_LOCATION') {
            return (
                <div className="text-center space-y-6 py-8 animate-in slide-in-from-right duration-300">
                    <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                        <MapPin className="w-10 h-10 text-orange-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Bước 3: Quét Kệ (Shelf)</h2>
                        <p className="text-slate-500">Quét mã vị trí trên kệ để hoàn tất</p>
                    </div>

                    <div className="bg-slate-100 p-3 rounded text-sm text-left mx-auto max-w-xs space-y-1">
                        <p><strong>Sản phẩm:</strong> {session.product?.productName}</p>
                        <p><strong>Số lượng:</strong> {session.quantity}</p>
                        {(session.mfgDate || session.expDate) && (
                            <p className="text-xs text-slate-500">Date: {session.mfgDate} - {session.expDate}</p>
                        )}
                    </div>

                    <Button variant="ghost" className="text-red-500 text-sm" onClick={() => setSession(prev => ({...prev, step: 'INPUT_DETAILS'}))}>
                        Quay lại sửa
                    </Button>
                </div>
            );
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto min-h-screen bg-slate-50">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <Button variant="outline" size="icon" onClick={() => navigate(-1)} className="bg-white">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-bold text-slate-800">Put Away (Cất hàng)</h1>
            </div>

            {/* Main Card */}
            <Card className="shadow-lg border-slate-200">
                <CardContent className="p-4">
                    {/* Progress Indicator */}
                    <div className="flex justify-center mb-6 gap-2">
                        <div className={`h-2 w-1/3 rounded-full transition-colors ${session.step === 'SCAN_PRODUCT' ? 'bg-blue-600' : 'bg-blue-200'}`} />
                        <div className={`h-2 w-1/3 rounded-full transition-colors ${session.step === 'INPUT_DETAILS' ? 'bg-blue-600' : (session.step === 'SCAN_LOCATION' ? 'bg-blue-600' : 'bg-slate-200')}`} />
                        <div className={`h-2 w-1/3 rounded-full transition-colors ${session.step === 'SCAN_LOCATION' ? 'bg-orange-500' : 'bg-slate-200'}`} />
                    </div>

                    {renderContent()}
                </CardContent>
            </Card>

            {/* Input & Scanner Area (Chỉ hiện ở Bước 1 và 3) */}
            {session.step !== 'INPUT_DETAILS' && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex gap-2 max-w-md mx-auto">
                    <Input
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                        placeholder={session.step === 'SCAN_PRODUCT' ? "Quét mã SP..." : "Quét mã KỆ..."}
                        className="h-12 text-lg shadow-sm"
                        autoFocus
                    />

                    <ScannerButton
                        onScanResult={(code) => code && handleScan(code)}
                        className="h-12 w-12 p-0 flex items-center justify-center bg-slate-800 text-white rounded-md shrink-0"
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <ScanLine />}
                    </ScannerButton>
                </div>
            )}

            <Toaster />
        </div>
    );
}