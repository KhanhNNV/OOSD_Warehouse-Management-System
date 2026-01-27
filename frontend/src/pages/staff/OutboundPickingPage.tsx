import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { outboundService } from "@/services/outbound.service";
import { PickingTaskState } from "@/types/outbound";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
    ArrowLeft,
    ScanBarcode,
    CheckCircle,
    MapPin,
    Box,
    Loader2,
    AlertTriangle,
    ScanLine
} from "lucide-react";
import { toastError } from "@/components/common/toastError.tsx";
import { ScannerButton } from "@/components/scanner/ScannerButton";

export default function OutboundPickingPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();

    // Lấy dữ liệu được truyền từ trang PickingInstruction
    const taskData = location.state as PickingTaskState;

    // States
    const [step, setStep] = useState<"SCAN_LOC" | "CONFIRM_QTY">("SCAN_LOC");
    const [scannedLocation, setScannedLocation] = useState("");
    const [inputQty, setInputQty] = useState<string>("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ref để auto-focus input
    const locInputRef = useRef<HTMLInputElement>(null);
    const qtyInputRef = useRef<HTMLInputElement>(null);

    // Auto focus logic
    useEffect(() => {
        if (step === "SCAN_LOC" && locInputRef.current) {
            locInputRef.current.focus();
        } else if (step === "CONFIRM_QTY" && qtyInputRef.current) {
            qtyInputRef.current.focus();
            // Set default qty
            if (taskData) setInputQty(taskData.qtyToPick.toString());
        }
    }, [step, taskData]);

    // Fail-safe nếu reload trang mất state
    if (!taskData || !orderId) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800">Không tìm thấy thông tin nhiệm vụ</h2>
                <p className="text-slate-500 mb-6">Vui lòng quay lại danh sách và chọn lại.</p>
                <Button onClick={() => navigate(-1)}>Quay lại</Button>
            </div>
        );
    }
    const validateLocation = (code: string) => {
        const scanned = code.trim().toUpperCase();
        const target = taskData.locationCode.trim().toUpperCase();

        if (scanned === target) {
            toast({
                title: "Vị trí chính xác!",
                className: "bg-green-600 text-white border-none"
            });
            setStep("CONFIRM_QTY");
        } else {
            toast({
                title: "Sai vị trí!",
                description: `Bạn đang quét ${scanned}, cần đến kệ ${target}`,
                variant: "destructive"
            });
            setScannedLocation(""); // Clear để quét lại
            locInputRef.current?.focus();
            setTimeout(() => {
                locInputRef.current?.focus();
            }, 100);
        }
    };
    // Handle: Quét mã vị trí nhập tay
    const handleScanLocation = (e: React.FormEvent) => {
        e.preventDefault();
        validateLocation(scannedLocation);
    };
    // Handle: Quét mã vị trí camera
    const handleCameraScan = (code: string) => {
        setScannedLocation(code);
        validateLocation(code);
    };
    // Handle: Submit API
    const handleSubmit = async () => {
        const qty = parseInt(inputQty);

        // Validation cơ bản
        if (isNaN(qty) || qty <= 0) {
            toast({ title: "Số lượng không hợp lệ", variant: "destructive" });
            return;
        }
        if (qty > taskData.qtyAvailable) {
            toast({ title: "Vượt quá tồn kho khả dụng", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await outboundService.scanPickItem({
                orderId: parseInt(orderId),
                inventoryId: taskData.inventoryId,
                locationCode: taskData.locationCode,
                quantity: qty
            });

            toast({
                title: "Lấy hàng thành công",
                description: `Đã cập nhật phiếu xuất cho ${taskData.productSku}`,
                className: "bg-green-600 text-white border-none"
            });

            // Quay lại trang danh sách sau 0.5s
            setTimeout(() => {
                navigate(-1);
            }, 500);

        } catch (error) {
            toastError(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 bg-slate-50 flex flex-col h-full overflow-hidden">
            {/* 1. Header Navigation */}
            <div className="bg-white p-3 border-b flex items-center gap-2 shadow-sm shrink-0">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10">
                    <ArrowLeft className="w-6 h-6 text-slate-600" />
                </Button>
                <div>
                    <h1 className="font-bold text-slate-800 text-lg leading-tight">Quét lấy hàng</h1>
                    <p className="text-xs text-slate-500">Đơn #{orderId}</p>
                </div>
            </div>

            {/* 2. Product Info Card */}
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200 mb-6">
                    <h2 className="font-bold text-lg text-slate-800 mb-1">{taskData.productName}</h2>
                    <div className="inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-sm font-mono border font-semibold">
                        {taskData.productSku}
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col items-center">
                            <div className="flex items-center gap-1 text-blue-600 text-xs font-bold uppercase mb-1">
                                <MapPin className="w-3 h-3" /> Vị trí
                            </div>
                            <span className="text-2xl font-black text-blue-700 tracking-tight">
                                {taskData.locationCode}
                            </span>
                        </div>

                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex flex-col items-center">
                            <div className="flex items-center gap-1 text-orange-600 text-xs font-bold uppercase mb-1">
                                <Box className="w-3 h-3" /> Cần lấy
                            </div>
                            <span className="text-2xl font-black text-orange-700">
                                {taskData.qtyToPick}
                            </span>
                        </div>
                    </div>
                </div>

                {/* 3. Action Area */}
                <div className="bg-white rounded-xl p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] border border-slate-200">

                    {step === "SCAN_LOC" ? (
                        // --- STEP 1: SCAN LOCATION ---
                        <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                    <ScanBarcode className="w-8 h-8 text-blue-600" />
                                </div>
                                <p className="font-medium text-slate-700">Quét mã vạch trên kệ</p>
                            </div>

                            <div className="flex gap-2">

                                <Input
                                    ref={locInputRef}
                                    value={scannedLocation}
                                    onChange={(e) => setScannedLocation(e.target.value)}
                                    placeholder="Quét mã kệ..."
                                    className="h-14 text-center text-xl font-mono uppercase tracking-wider border-2 focus-visible:ring-blue-500"
                                    autoComplete="off"
                                />

                                <div className="shrink-0">
                                    <ScannerButton
                                        onScanResult={handleCameraScan}
                                        className="h-14 w-14 bg-slate-800 hover:bg-slate-900 text-white rounded-lg p-0 flex items-center justify-center shadow-md"
                                    >

                                    </ScannerButton>
                                </div>
                            </div>

                            {/* Nút xác nhận cho form nhập tay */}
                            <Button onClick={handleScanLocation} className="w-full h-12 text-lg font-semibold bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                Xác nhận
                            </Button>
                        </div>

                    ) : (
                        // --- STEP 2: CONFIRM QUANTITY ---
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="text-center">
                                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                                <p className="text-green-700 font-bold text-lg">Vị trí chính xác!</p>
                            </div>

                            <div className="space-y-3">
                                <label className="text-sm font-medium text-slate-500 block text-center">
                                    Nhập số lượng thực tế lấy
                                </label>

                                <div className="flex items-center gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-14 w-14 text-2xl font-bold border-2"
                                        onClick={() => setInputQty(prev => Math.max(1, (parseInt(prev) || 0) - 1).toString())}
                                    >
                                        -
                                    </Button>

                                    <Input
                                        ref={qtyInputRef}
                                        type="number"
                                        value={inputQty}
                                        onChange={(e) => setInputQty(e.target.value)}
                                        className="h-14 text-center text-3xl font-bold border-2 focus-visible:ring-green-500"
                                    />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-14 w-14 text-2xl font-bold border-2"
                                        onClick={() => setInputQty(prev => ((parseInt(prev) || 0) + 1).toString())}
                                    >
                                        +
                                    </Button>
                                </div>
                            </div>

                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                        Đang xử lý...
                                    </>
                                ) : (
                                    "HOÀN THÀNH"
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}