import React, { useState } from "react";
import { usePutAwayScanner } from "@/hooks/usePutAwayScanner";
import { ScannerButton } from "@/components/scanner/ScannerButton"; // Component camera cũ của bạn
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, MapPin, Box, Loader2, Save, Calendar } from "lucide-react";
import { toast } from "sonner";
import { putAwayService } from "@/services/putAway.service.ts";
import { Label } from "@/components/ui/label";

export default function PutAwayPage() {
    const {
        currentShelf, setCurrentShelf,
        scannedItems, handleScan, isLoading,
        modalData, setModalData, addItem, removeItem, clearAll
    } = usePutAwayScanner();

    const [manualCode, setManualCode] = useState("");

    // State tạm cho modal nhập liệu
    const [tempQty, setTempQty] = useState("");
    const [tempMfg, setTempMfg] = useState("");
    const [tempExp, setTempExp] = useState("");

    // Khi Modal mở lên, reset/fill dữ liệu
    React.useEffect(() => {
        if (modalData.isOpen && modalData.product) {
            setTempQty(modalData.product.inputQty.toString());
            // Tự động điền date hôm nay hoặc logic nào đó nếu cần
            setTempMfg("");
            setTempExp("");
        }
    }, [modalData.isOpen]);

    const handleManualSubmit = () => {
        handleScan(manualCode);
        setManualCode("");
    }

    const handleSaveItem = () => {
        if(!modalData.product) return;
        const qty = parseInt(tempQty);
        if (isNaN(qty) || qty <= 0) { toast.error("Số lượng không hợp lệ"); return; }

        // Validate Date (Tùy nghiệp vụ có bắt buộc không)
        if (!tempMfg || !tempExp) { toast.warning("Vui lòng nhập ngày SX và Hạn SD"); return; }

        addItem({
            ...modalData.product,
            inputQty: qty,
            manufactureDate: tempMfg,
            expiryDate: tempExp
        });
    };

    const handleSubmitToServer = async () => {
        // Gửi từng item hoặc gửi cả list
        try {
            // Demo gửi loop từng item (thực tế nên viết API bulk)
            for (const item of scannedItems) {
                await putAwayService.submitPutAway({
                    productId: item.productId,
                    targetShelfCode: item.targetShelfCode,
                    quantity: item.inputQty,
                    manufactureDate: item.manufactureDate,
                    expiryDate: item.expiryDate
                });
            }
            toast.success("Đã cất hàng lên kệ thành công!");
            clearAll();
        } catch (e) {
            toast.error("Lỗi khi gửi dữ liệu");
        }
    };

    return (
        <div className="p-4 max-w-4xl mx-auto space-y-4 pb-32">
            {/* 1. KHUNG CHỌN KỆ (Current Context) */}
            <div className={`p-4 rounded-lg border-2 border-dashed flex items-center justify-between transition-colors ${currentShelf ? 'bg-green-50 border-green-300' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-full ${currentShelf ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                        <MapPin className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-500 font-medium">Vị trí đích (Kệ)</p>
                        {currentShelf ? (
                            <h2 className="text-xl font-bold text-green-700">{currentShelf.code}</h2>
                        ) : (
                            <h2 className="text-lg font-bold text-slate-400">Chưa chọn kệ...</h2>
                        )}
                    </div>
                </div>
                {currentShelf && <Button variant="ghost" size="sm" onClick={() => setCurrentShelf(null)}><Trash2 className="w-4 h-4 text-slate-400"/></Button>}
            </div>

            {/* 2. THANH CÔNG CỤ QUÉT */}
            <div className="flex gap-2">
                <Input
                    placeholder="Quét mã Kệ hoặc Sản phẩm..."
                    value={manualCode}
                    onChange={e => setManualCode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualSubmit()}
                    className="bg-white"
                />
                <ScannerButton onScanResult={handleScan} />
            </div>

            {/* 3. DANH SÁCH CHỜ CẤT (Staging List) */}
            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead>Kệ</TableHead>
                                <TableHead className="text-right">SL</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {scannedItems.length === 0 ? (
                                <TableRow><TableCell colSpan={4} className="text-center h-32 text-slate-400">Chưa có sản phẩm nào được quét</TableCell></TableRow>
                            ) : (
                                scannedItems.map((item, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>
                                            <div className="font-medium">{item.productName}</div>
                                            <div className="text-xs text-slate-500 flex gap-2 mt-1">
                                                <span>NSX: {item.manufactureDate}</span>
                                                <span>HSD: {item.expiryDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{item.targetShelfCode}</Badge></TableCell>
                                        <TableCell className="text-right font-bold">{item.inputQty}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removeItem(idx)}><Trash2 className="w-4 h-4"/></Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Footer Action */}
            {scannedItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg flex justify-end">
                    <Button onClick={handleSubmitToServer} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2"/> Hoàn tất Put-Away ({scannedItems.length})
                    </Button>
                </div>
            )}

            {/* --- MODAL NHẬP CHI TIẾT PUT-AWAY --- */}
            {modalData.isOpen && modalData.product && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4 animate-in zoom-in-95">
                        <h3 className="font-bold text-lg border-b pb-2">Thông tin nhập kho</h3>

                        <div className="flex gap-3 bg-slate-50 p-3 rounded">
                            <img src={modalData.product.imageProduct} className="w-12 h-12 object-cover rounded" />
                            <div>
                                <div className="font-medium line-clamp-1">{modalData.product.productName}</div>
                                <div className="text-xs text-slate-500">{modalData.product.sku}</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <Label>Số lượng cất lên kệ</Label>
                                <Input type="number" className="text-center font-bold text-lg" value={tempQty} onChange={e => setTempQty(e.target.value)} autoFocus />
                            </div>

                            {/* Input Ngày tháng quan trọng cho Put Away */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label className="text-xs">Ngày SX</Label>
                                    <div className="relative">
                                        <Input type="date" value={tempMfg} onChange={e => setTempMfg(e.target.value)} />
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-xs">Hạn SD</Label>
                                    <div className="relative">
                                        <Input type="date" value={tempExp} onChange={e => setTempExp(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setModalData({...modalData, isOpen: false})}>Hủy</Button>
                            <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handleSaveItem}>Xác nhận</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white/50 backdrop-blur-sm">
                    <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                </div>
            )}
        </div>
    );
}