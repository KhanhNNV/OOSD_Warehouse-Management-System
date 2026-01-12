import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
    ArrowLeft, MapPin, Package, CheckCircle2, 
    AlertCircle, ChevronRight, ScanLine, Box, X
} from "lucide-react";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ScannerModal } from "@/components/scanner/ScannerModal";

// --- MOCK DATA ---
const MOCK_TASKS = [
    { 
        id: 1, 
        productName: "Laptop Dell Latitude 7420", 
        sku: "DELL-7420", 
        locationCode: "A-01-01", 
        locationId: 101, 
        reqQty: 2, 
        status: "PENDING"
    },
    { 
        id: 2, 
        productName: "Chuột Logitech M331", 
        sku: "LOG-M331", 
        locationCode: "B-02-01", 
        locationId: 205, 
        reqQty: 5, 
        status: "PENDING" 
    },
    { 
        id: 3, 
        productName: "Chuột Logitech M331",
        sku: "LOG-M331", 
        locationCode: "B-02-02", 
        locationId: 206, 
        reqQty: 3, 
        status: "PENDING" 
    },
];

type StepType = 'SCAN_LOC' | 'SCAN_PROD' | 'INPUT_QTY';

export default function OutboundPickingPage() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { toast } = useToast();

    // --- STATE ---
    const [tasks, setTasks] = useState(MOCK_TASKS);
    const [activeTaskId, setActiveTaskId] = useState<number | null>(null);
    const [step, setStep] = useState<StepType>('SCAN_LOC');
    
    // Scanner State
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [pickedQty, setPickedQty] = useState("");
    
    // Report State
    const [showReport, setShowReport] = useState(false);
    const [reportReason, setReportReason] = useState("");

    // Computed
    const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId]);
    const progress = Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100);
    const completedCount = tasks.filter(t => t.status === 'COMPLETED').length;

    // --- HANDLERS ---
    const handleSelectTask = (taskId: number) => {
        const task = tasks.find(t => t.id === taskId);
        if (task?.status === 'COMPLETED') return;
        setActiveTaskId(taskId);
        setStep('SCAN_LOC');
        setPickedQty(task?.reqQty.toString() || "");
        setManualInput("");
    };

    const verifyWithServer = async (type: 'LOC' | 'PROD', code: string) => {
        return new Promise<boolean>((resolve) => {
            setTimeout(() => {
                if (!activeTask) return resolve(false);
                
                if (type === 'LOC') {
                    const isValid = code.trim().toUpperCase() === activeTask.locationCode;
                    resolve(isValid);
                } 
                else if (type === 'PROD') {
                    const isValid = code.trim().toUpperCase() === activeTask.sku;
                    resolve(isValid);
                }
            }, 300);
        });
    };

    const handleScan = async (code: string) => {
        if (!activeTask) return;

        if (step === 'SCAN_LOC') {
            const isOk = await verifyWithServer('LOC', code);
            if (isOk) {
                toast({ 
                    title: "✅ Đúng kệ!", 
                    description: "Tiếp tục quét sản phẩm.",
                    className: "bg-green-50 border-green-200"
                });
                setStep('SCAN_PROD');
            } else {
                toast({ 
                    title: "❌ Sai kệ!", 
                    description: `Mã quét: ${code}. Cần đến: ${activeTask.locationCode}`,
                    variant: "destructive" 
                });
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        } 
        else if (step === 'SCAN_PROD') {
            const isOk = await verifyWithServer('PROD', code);
            if (isOk) {
                toast({ 
                    title: "✅ Đúng sản phẩm!", 
                    description: "Nhập số lượng thực tế.",
                    className: "bg-green-50 border-green-200"
                });
                setStep('INPUT_QTY');
            } else {
                toast({ 
                    title: "❌ Sai sản phẩm!", 
                    description: `Mã quét: ${code}. Cần SKU: ${activeTask.sku}`,
                    variant: "destructive" 
                });
                if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
            }
        }
        setIsScannerOpen(false);
        setManualInput("");
    };

    const handleConfirmQty = () => {
        if (!activeTask) return;
        const qty = parseInt(pickedQty);
        
        if (isNaN(qty) || qty < 0) {
            toast({ title: "Lỗi", description: "Số lượng không hợp lệ", variant: "destructive" });
            return;
        }

        if (qty < activeTask.reqQty) {
            setReportReason("Thiếu hàng tại kệ");
            setShowReport(true);
            return;
        }
        
        if (qty > activeTask.reqQty) {
            toast({ 
                title: "Cảnh báo", 
                description: "Không được lấy dư số lượng yêu cầu!", 
                variant: "destructive" 
            });
            return;
        }

        completeTask('COMPLETED');
    };

    const completeTask = (newStatus: string) => {
        setTasks(prev => prev.map(t => t.id === activeTaskId ? { ...t, status: newStatus } : t));
        setActiveTaskId(null);
        setStep('SCAN_LOC');
        setManualInput("");
        setPickedQty("");
        
        toast({ 
            title: "Đã hoàn thành", 
            description: "Đã cập nhật trạng thái",
            className: "bg-blue-50 border-blue-200"
        });
    };

    const handleReportSubmit = () => {
        completeTask('FLAGGED');
        setShowReport(false);
        setReportReason("");
    };

    // --- RENDER SECTIONS (ĐÃ TINH CHỈNH) ---

    // 1. Màn hình chi tiết (FOCUS MODE) - Optimized cho mobile
    if (activeTaskId && activeTask) {
        return (
            <div className="flex flex-col h-screen bg-slate-50 relative">
                {/* Header - Compact */}
                <div className="bg-white p-3 border-b flex items-center gap-2 shrink-0">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9" 
                        onClick={() => setActiveTaskId(null)}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex-1 min-w-0">
                        <h2 className="font-semibold text-base truncate">{activeTask.productName}</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="truncate">{activeTask.sku}</span>
                            <span>•</span>
                            <span className="font-medium">{activeTask.reqQty} cái</span>
                        </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                        {step === 'SCAN_LOC' ? '1/3' : step === 'SCAN_PROD' ? '2/3' : '3/3'}
                    </Badge>
                </div>

                {/* Progress Steps - Compact */}
                <div className="bg-white p-3 border-b">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                        <span className={step === 'SCAN_LOC' ? "font-bold text-orange-600" : ""}>Quét kệ</span>
                        <span className={step === 'SCAN_PROD' ? "font-bold text-blue-600" : ""}>Quét SP</span>
                        <span className={step === 'INPUT_QTY' ? "font-bold text-green-600" : ""}>Nhập SL</span>
                    </div>
                    <div className="flex gap-1">
                        <div className={`h-1.5 flex-1 rounded-full ${step === 'SCAN_LOC' ? 'bg-orange-500' : 'bg-green-500'}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step === 'SCAN_LOC' ? 'bg-slate-200' : (step === 'SCAN_PROD' ? 'bg-blue-500' : 'bg-green-500')}`} />
                        <div className={`h-1.5 flex-1 rounded-full ${step === 'INPUT_QTY' ? 'bg-green-500' : 'bg-slate-200'}`} />
                    </div>
                </div>

                {/* Main Content - Minimal & Focused */}
                <div className="flex-0 p-4 flex flex-col gap-4 overflow-y-auto">
                    {/* Current Step Card */}
                    {step === 'SCAN_LOC' && (
                        <Card className="border-2 border-orange-300 bg-orange-50/50 shadow-sm">
                            <CardContent className="p-5 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm border">
                                        <MapPin className="w-7 h-7 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-slate-600 mb-1">Đi đến kệ</p>
                                        <div className="text-3xl font-black text-slate-800 tracking-wider">
                                            {activeTask.locationCode}
                                        </div>
                                    </div>  
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'SCAN_PROD' && (
                        <Card className="border-2 border-blue-300 bg-blue-50/50 shadow-sm">
                            <CardContent className="p-5">
                                <div className="text-center mb-4">
                                    <Badge variant="secondary" className="mb-2">
                                        Kệ: {activeTask.locationCode}
                                    </Badge>
                                    <p className="text-sm text-slate-600 mb-2">Quét sản phẩm</p>
                                    <div className="font-bold text-lg text-slate-800">
                                        {activeTask.productName}
                                    </div>
                                    <div className="text-sm text-slate-500 mt-1">SKU: {activeTask.sku}</div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 'INPUT_QTY' && (
                        <Card className="border-2 border-green-300 bg-green-50/50 shadow-sm">
                            <CardContent className="p-5">
                                <div className="text-center">
                                    <div className="flex items-center justify-center gap-2 mb-3">
                                        <Package className="w-5 h-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-700">Xác nhận số lượng</span>
                                    </div>
                                    
                                    <div className="mb-4">
                                        <div className="font-medium text-slate-700">{activeTask.productName}</div>
                                        <div className="text-sm text-slate-500">SKU: {activeTask.sku}</div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-full"
                                            onClick={() => setPickedQty(prev => Math.max(0, parseInt(prev||'0') - 1).toString())}
                                        >
                                            -
                                        </Button>
                                        
                                        <div className="relative">
                                            <Input 
                                                type="number" 
                                                className="h-12 w-28 text-center text-2xl font-bold bg-white border-green-300" 
                                                value={pickedQty}
                                                onChange={e => setPickedQty(e.target.value)}
                                            />
                                            <div className="absolute -bottom-5 left-0 right-0 text-xs text-slate-400">
                                                Yêu cầu: {activeTask.reqQty}
                                            </div>
                                        </div>
                                        
                                        <Button 
                                            variant="outline" 
                                            size="icon" 
                                            className="h-10 w-10 rounded-full"
                                            onClick={() => setPickedQty(prev => (parseInt(prev||'0') + 1).toString())}
                                        >
                                            +
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* FIXED SCAN/CONFIRM BUTTON - Always visible and clear */}
                <div className="p-3 bg-white border-t shadow-lg">
                    {step === 'INPUT_QTY' ? (
                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 border-red-200 text-red-600"
                                onClick={() => setShowReport(true)}
                            >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Báo lỗi
                            </Button>
                            <Button 
                                className="flex-[2] bg-green-600 hover:bg-green-700"
                                onClick={handleConfirmQty}
                            >
                                Xác nhận
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Input 
                                    placeholder={step === 'SCAN_LOC' ? "Mã kệ..." : "Mã sản phẩm..."}
                                    value={manualInput}
                                    onChange={e => setManualInput(e.target.value)}
                                    className="h-12 flex-1"
                                    onKeyPress={(e) => e.key === 'Enter' && manualInput && handleScan(manualInput)}
                                />
                                {manualInput && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-12 w-12"
                                        onClick={() => setManualInput("")}
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                            <Button 
                                className={`w-full h-12 text-base ${step === 'SCAN_LOC' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                onClick={() => manualInput ? handleScan(manualInput) : setIsScannerOpen(true)}
                            >
                                <ScanLine className="w-5 h-5 mr-2" />
                                {manualInput ? "Xác nhận mã" : "BẬT CAMERA QUÉT"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Modals */}
                <ScannerModal 
                    open={isScannerOpen} 
                    onOpenChange={setIsScannerOpen} 
                    onScanSuccess={handleScan} 
                />

                <Dialog open={showReport} onOpenChange={setShowReport}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertCircle className="text-red-600" />
                                Báo cáo sự cố
                            </DialogTitle>
                            <DialogDescription>
                                Kệ: {activeTask.locationCode} • SKU: {activeTask.sku}
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 py-2">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">
                                    Số lượng thực tế
                                </label>
                                <Input 
                                    type="number" 
                                    value={pickedQty}
                                    onChange={e => setPickedQty(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1">
                                    Lý do
                                </label>
                                <Textarea 
                                    placeholder="Ví dụ: Hết hàng, Hư hỏng, Không tìm thấy..."
                                    value={reportReason}
                                    onChange={e => setReportReason(e.target.value)}
                                    className="min-h-[80px]"
                                />
                            </div>
                        </div>
                        
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setShowReport(false)}>
                                Hủy
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleReportSubmit}
                                disabled={!reportReason.trim()}
                            >
                                Gửi báo cáo
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // 2. Màn hình Danh sách (LIST VIEW) - Optimized
    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-9 w-9"
                            onClick={() => navigate(-1)}
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <h1 className="font-bold text-lg">Lấy hàng #{id}</h1>
                    </div>
                    <Badge variant={progress === 100 ? "default" : "secondary"} className="text-sm">
                        {completedCount}/{tasks.length}
                    </Badge>
                </div>
                <Progress value={progress} className="h-2 mt-1" />
            </div>
            
            {/* Task List - Compact */}
            <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-2">
                    {tasks.map((task) => (
                        <Card 
                            key={task.id}
                            onClick={() => handleSelectTask(task.id)}
                            className={`relative border transition-all active:scale-[0.99] ${
                                task.status === 'COMPLETED' ? 'border-green-200 bg-green-50/50' : 
                                task.status === 'FLAGGED' ? 'border-red-200 bg-red-50/50' : 
                                'border-slate-200 hover:border-orange-300'
                            }`}
                        >
                            <CardContent className="p-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <div className={`p-1.5 rounded-md ${
                                                task.status === 'COMPLETED' ? 'bg-green-100 text-green-600' :
                                                task.status === 'FLAGGED' ? 'bg-red-100 text-red-600' :
                                                'bg-slate-100 text-slate-500'
                                            }`}>
                                                {task.status === 'COMPLETED' ? 
                                                    <CheckCircle2 size={16} /> : 
                                                    <Box size={16} />
                                                }
                                            </div>
                                            <div className="font-bold text-base truncate">
                                                {task.locationCode}
                                            </div>
                                        </div>
                                        
                                        <div className="ml-8">
                                            <div className="text-sm font-medium text-slate-800 line-clamp-1">
                                                {task.productName}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                                <span>SKU: {task.sku}</span>
                                                <span>•</span>
                                                <span className="font-semibold">{task.reqQty} cái</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {task.status === 'PENDING' && (
                                        <ChevronRight className="w-5 h-5 text-slate-400 ml-2 flex-shrink-0" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Footer - Always visible */}
            <div className="p-3 bg-white border-t shadow-lg">
                <Button 
                    className="w-full h-12 text-base font-medium"
                    disabled={progress < 100}
                    onClick={() => {
                        if (progress === 100) {
                            toast({
                                title: "✅ Hoàn thành đơn hàng!",
                                description: "Đang gửi dữ liệu về server...",
                                className: "bg-green-50 border-green-200"
                            });
                        }
                    }}
                >
                    {progress < 100 ? (
                        `Còn ${tasks.length - completedCount} dòng chưa xong`
                    ) : (
                        "HOÀN THÀNH ĐƠN HÀNG"
                    )}
                </Button>
            </div>
        </div>
    );
}