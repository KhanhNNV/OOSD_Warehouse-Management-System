import React, { useState, useEffect } from "react";
import { ArrowLeft, ScanLine, Loader2, AlertCircle, Save, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScannerModal } from "@/components/scanner/ScannerModal";
import { outboundForStaffService } from "@/services/outboundForStaff.service.ts";
import { PickingTask } from "@/types/outboundDetails";
import { LocalPickingResult } from "@/types/outbound.ts";

// Định nghĩa các bước thực hiện
type StepType = 'SCAN_LOC' | 'SCAN_PROD' | 'INPUT_QTY';

// Cấu trúc dữ liệu tạm (Session Resume)
interface SavedSession {
    step: StepType;
    pickedQty: string;
    timestamp: number;
}

interface Props {
    orderId: number; // ID đơn hàng để tạo key lưu trữ chung
    task: PickingTask;
    onBack: () => void;
    // Callback báo cho cha biết đã xong task này
    onComplete: (status: 'COMPLETED' | 'FLAGGED', qty: number, note?: string) => void;
}

export const PickingExecutionView: React.FC<Props> = ({ orderId, task, onBack, onComplete }) => {
    const { toast } = useToast();
    
    // Key dùng để lưu trạng thái tạm thời (Resume khi F5)
    const SESSION_KEY = `picking_session_task_${task.id}`; 
    
    // --- STATE ---
    const [step, setStep] = useState<StepType>('SCAN_LOC');
    const [pickedQty, setPickedQty] = useState(task.requested_qty.toString());
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [manualInput, setManualInput] = useState("");
    
    const [isVerifying, setIsVerifying] = useState(false); 
    const [isSaving, setIsSaving] = useState(false);       
    
    // State cho Modal báo cáo & Khôi phục
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState("");
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [savedDataToRestore, setSavedDataToRestore] = useState<SavedSession | null>(null);

    // --- EFFECT 1: KIỂM TRA DỮ LIỆU CŨ (SESSION RESUME) ---
    useEffect(() => {
        const savedJson = localStorage.getItem(SESSION_KEY);
        if (savedJson) {
            try {
                const parsed: SavedSession = JSON.parse(savedJson);
                // Logic phụ: Có thể check timestamp nếu quá 24h thì không restore
                setSavedDataToRestore(parsed);
                setShowRestoreDialog(true); 
            } catch (e) {
                localStorage.removeItem(SESSION_KEY);
            }
        }
    }, [SESSION_KEY]);

    // --- EFFECT 2: TỰ ĐỘNG LƯU SESSION TẠM KHI STATE THAY ĐỔI ---
    useEffect(() => {

        if (step !== 'SCAN_LOC' || pickedQty !== task.requested_qty.toString()) {
            const session: SavedSession = {
                step,
                pickedQty,
                timestamp: Date.now()
            };
            localStorage.setItem(SESSION_KEY, JSON.stringify(session));
        }
    }, [step, pickedQty, SESSION_KEY, task.requested_qty]);

    // --- LOGIC: KHÔI PHỤC HOẶC XÓA SESSION ---
    const handleRestore = () => {
        if (savedDataToRestore) {
            setStep(savedDataToRestore.step);
            setPickedQty(savedDataToRestore.pickedQty);
            toast({ title: "Đã khôi phục phiên làm việc", className: "bg-blue-100" });
        }
        setShowRestoreDialog(false);
    };

    const handleDiscard = () => {
        localStorage.removeItem(SESSION_KEY);
        setStep('SCAN_LOC'); 
        setPickedQty(task.requested_qty.toString());
        setShowRestoreDialog(false);
        toast({ title: "Đã xóa dữ liệu cũ", description: "Bắt đầu lại từ đầu." });
    };

    // --- LOGIC 1: XỬ LÝ QUÉT MÃ (VERIFY VỚI API) ---
    const handleScan = async (code: string) => {
        setIsVerifying(true);
        try {
            if (step === 'SCAN_LOC') {
                if (!task.locationCode || !task.locationId) {
                    toast({ title: "Lỗi", description: "Dữ liệu task lỗi (Thiếu Location ID)", variant: "destructive" });
                    return;
                }
                // Gọi API Verify Location
                const result = await outboundForStaffService.verifyLocation(task.locationId, code);
                
                if (result.isMatched) { 
                    toast({ title: "✅ Vị trí chính xác", className: "bg-green-100 border-green-200" });
                    setStep('SCAN_PROD');   
                } else {
                    toast({ title: "❌ Sai vị trí!", description: result.message, variant: "destructive" });
                    if (navigator.vibrate) navigator.vibrate([200]);
                }

            } else if (step === 'SCAN_PROD') {
                // Gọi API Verify Product
                const result = await outboundForStaffService.verifyProduct(task.productId, code);
                
                if (result.isMatched) {
                    toast({ title: "✅ Sản phẩm chính xác", className: "bg-green-100 border-green-200" });
                    setStep('INPUT_QTY');
                } else {
                    toast({ title: "❌ Sai sản phẩm!", description: result.message, variant: "destructive" });
                    if (navigator.vibrate) navigator.vibrate([200]);
                }
            }
        } catch (err) {
            toast({ title: "Lỗi", description: "Không thể kết nối Server để kiểm tra mã", variant: "destructive" });
        } finally {
            setIsVerifying(false);
            setIsScannerOpen(false);
            setManualInput("");
        }
    };

    // --- LOGIC 2: XÁC NHẬN & LƯU LOCALSTORAGE (OFFLINE FIRST) ---
    const handleConfirmTask = async (isFlagged: boolean = false, reason: string = "") => {
        const qty = parseInt(pickedQty);
        
        // 1. Validate Client
        if (isNaN(qty) || qty < 0) {
            toast({ title: "Lỗi", description: "Số lượng không hợp lệ", variant: "destructive" });
            return;
        }

        // Nếu thiếu hàng mà chưa có cờ báo lỗi -> Bắt buộc báo cáo
        const required = task.requested_qty;
        if (!isFlagged && qty < required) {
            setReportReason("Thiếu hàng thực tế");
            setShowReport(true); // Mở modal báo cáo
            return;
        }

        setIsSaving(true);
        try {
            // 2. Tạo Object kết quả chuẩn
            const result: LocalPickingResult = {
                outboundDetailId: task.id,
                productId: task.productId,
                locationId: task.locationId!, // Chắc chắn có vì đã verify ở bước 1
                actualQty: qty,
                isFlagged: isFlagged,
                note: reason,
                timestamp: Date.now()
            };

            // 3. Lưu vào LocalStorage chung của Đơn hàng (Thông qua Service)
            outboundForStaffService.saveLocalResult(orderId, result);

            // 4. Xóa Session tạm (của task này) vì đã hoàn thành
            localStorage.removeItem(SESSION_KEY);

            toast({ title: "Đã lưu kết quả", description: "Cập nhật thành công." });
            
            // 5. Báo cho Component cha để update list UI
            onComplete(isFlagged ? 'FLAGGED' : 'COMPLETED', qty, reason);

        } catch (error) {
            console.error(error);
            toast({ title: "Lỗi lưu dữ liệu", description: "Không thể lưu vào bộ nhớ máy", variant: "destructive" });
        } finally {
            setIsSaving(false);
            setShowReport(false);
        }
    };

    // --- RENDER GIAO DIỆN ---
    return (
        <div className="flex flex-col h-screen bg-slate-50 relative">
            {/* Header */}
            <div className="bg-white p-3 border-b flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="w-5 h-5" /></Button>
                <div className="flex-1 overflow-hidden">
                    <h2 className="font-bold truncate text-slate-800">{task.productName}</h2>
                    <div className="text-xs text-slate-500">{task.productSku} • SL Yêu cầu: <b>{task.requested_qty}</b></div>
                </div>
                <Badge variant={step === 'INPUT_QTY' ? 'default' : 'outline'}>
                    {step === 'SCAN_LOC' ? 'B1: Kệ' : step === 'SCAN_PROD' ? 'B2: SP' : 'B3: SL'}
                </Badge>
            </div>

            {/* Progress Bar */}
            <div className="flex h-1">
                <div className={`flex-1 transition-all duration-300 ${['SCAN_LOC', 'SCAN_PROD', 'INPUT_QTY'].includes(step) ? 'bg-orange-500' : 'bg-slate-200'}`} />
                <div className={`flex-1 transition-all duration-300 ${['SCAN_PROD', 'INPUT_QTY'].includes(step) ? 'bg-orange-500' : 'bg-slate-200'}`} />
                <div className={`flex-1 transition-all duration-300 ${['INPUT_QTY'].includes(step) ? 'bg-orange-500' : 'bg-slate-200'}`} />
            </div>

            {/* Main Content Area */}
            <div className="flex-0 p-6 flex flex-col items-center justify-center gap-6 overflow-y-auto">
                {step === 'SCAN_LOC' && (
                    <div className="w-full text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-white border-2 border-orange-500 rounded-xl p-8 shadow-lg mb-4">
                            <p className="text-slate-500 text-sm mb-2 font-bold uppercase">Đến vị trí</p>
                            <div className="text-5xl font-black text-slate-900 tracking-tighter break-all">
                                {task.locationCode || "---"}
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm">Quét mã vạch trên kệ để xác nhận</p>
                    </div>
                )}

                {step === 'SCAN_PROD' && (
                    <div className="w-full text-center animate-in fade-in zoom-in duration-300">
                        <Badge variant="secondary" className="mb-4 text-lg px-4 bg-green-100 text-green-700 hover:bg-green-100">✅ Đã đúng kệ</Badge>
                        <div className="bg-white border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                            <p className="text-slate-500 text-sm mb-1">Quét sản phẩm</p>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">{task.productName}</h3>
                            <div className="bg-slate-100 p-3 rounded text-blue-700 font-mono text-xl font-bold">{task.productSku}</div>
                        </div>
                    </div>
                )}

                {step === 'INPUT_QTY' && (
                    <div className="w-full text-center animate-in fade-in zoom-in duration-300">
                        <div className="bg-white border-2 border-green-500 rounded-xl p-6 shadow-lg">
                            <p className="text-slate-500 mb-4">Nhập số lượng thực lấy</p>
                            <div className="flex items-center justify-center gap-4">
                                <Button variant="outline" className="h-14 w-14 rounded-full text-2xl" onClick={() => setPickedQty(p => (Math.max(0, parseInt(p || '0') - 1)).toString())}>-</Button>
                                <Input className="h-20 w-32 text-center text-5xl font-bold border-none shadow-none ring-0 focus-visible:ring-0" value={pickedQty} onChange={e => setPickedQty(e.target.value)} type="number" />
                                <Button variant="outline" className="h-14 w-14 rounded-full text-2xl" onClick={() => setPickedQty(p => (parseInt(p || '0') + 1).toString())}>+</Button>
                            </div>
                            <div className="mt-4 text-slate-400 font-medium">Yêu cầu: {task.requested_qty}</div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t shrink-0 pb-8">
                {step === 'INPUT_QTY' ? (
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-14 aspect-square border-red-200 text-red-600" onClick={() => setShowReport(true)} disabled={isSaving}>
                            <AlertCircle />
                        </Button>
                        <Button 
                            className="flex-1 h-14 bg-green-600 hover:bg-green-700 text-lg font-bold shadow-lg" 
                            onClick={() => handleConfirmTask(false)}
                            disabled={isSaving}
                        >
                            {isSaving ? <Loader2 className="animate-spin mr-2" /> : "XÁC NHẬN"}
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <Input placeholder="Nhập mã tay..." value={manualInput} onChange={e => setManualInput(e.target.value)} className="h-14 text-lg" />
                        <Button
                            className={`h-14 px-6 text-lg font-bold shadow-lg ${step === 'SCAN_LOC' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            onClick={() => manualInput ? handleScan(manualInput) : setIsScannerOpen(true)}
                            disabled={isVerifying}
                        >
                            {isVerifying ? <Loader2 className="animate-spin" /> : manualInput ? "Gửi" : <><ScanLine className="mr-2" /> Quét</>}
                        </Button>
                    </div>
                )}
            </div>

            {/* --- CÁC MODAL --- */}
            
            {/* Modal Quét Camera */}
            <ScannerModal open={isScannerOpen} onOpenChange={setIsScannerOpen} onScanSuccess={handleScan} />
            
            {/* Modal Báo cáo lỗi / Thiếu hàng */}
            <Dialog open={showReport} onOpenChange={setShowReport}>
                <DialogContent>
                    <DialogHeader><DialogTitle className="text-red-600">Xác nhận thiếu hàng/Lỗi</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Số lượng thực tế lấy được:</label>
                            <Input type="number" value={pickedQty} onChange={e => setPickedQty(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lý do:</label>
                            <Textarea placeholder="VD: Hàng vỡ, Không tìm thấy hàng..." value={reportReason} onChange={e => setReportReason(e.target.value)} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReport(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={() => handleConfirmTask(true, reportReason)} disabled={isSaving}>
                            {isSaving ? <Loader2 className="animate-spin" /> : "Xác nhận & Lưu"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal Khôi phục phiên làm việc */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2"><RefreshCw className="w-5 h-5 text-blue-600" /> Khôi phục phiên làm việc?</DialogTitle>
                        <DialogDescription>
                            Bạn đang làm dở task này trước đó. Bạn có muốn khôi phục lại trạng thái cũ không?
                        </DialogDescription>
                    </DialogHeader>
                    {savedDataToRestore && (
                        <div className="bg-slate-50 p-4 rounded-md text-sm text-slate-700">
                            <p>• Bước: <b>{savedDataToRestore.step === 'SCAN_LOC' ? 'Quét Kệ' : savedDataToRestore.step === 'SCAN_PROD' ? 'Quét SP' : 'Nhập SL'}</b></p>
                            <p>• Số lượng đang nhập: <b>{savedDataToRestore.pickedQty}</b></p>
                        </div>
                    )}
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="destructive" onClick={handleDiscard} className="gap-2"><Trash2 className="w-4 h-4" /> Xóa, làm lại</Button>
                        <Button onClick={handleRestore} className="gap-2 bg-blue-600"><Save className="w-4 h-4" /> Khôi phục</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
