import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCcw, X } from "lucide-react";

interface ScannerModalProp {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onScanSuccess: (text: string) => void;
}

export function ScannerModal({ open, onOpenChange, onScanSuccess }: ScannerModalProp) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Hàm khởi động Camera
    const startScanner = async () => {
        setIsLoading(true);
        setError(null);

        try {
            if (scannerRef.current) {
                await handleStop();
            }

            // Tạo instance mới
            const scanner = new Html5Qrcode("reader");
            scannerRef.current = scanner;

            const config = {
                fps: 15,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.EAN_13 
                ]
            };

            await scanner.start(
                { facingMode: "environment" }, // Ưu tiên cam sau
                config,
                (decodedText) => {
                    // Khi quét thành công
                    handleStop();
                    onScanSuccess(decodedText);
                },
                () => { 
                    // Lỗi quét từng frame -> bỏ qua không cần log
                }
            );

            setIsLoading(false);
        } catch (err) {
            console.error("Scanner Error:", err);
            setIsLoading(false);
            setError("Không thể mở Camera. Vui lòng cấp quyền truy cập.");
        }
    };

    // Hàm dừng Camera
    const handleStop = async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                console.warn("Error stopping scanner", e);
            }
            scannerRef.current = null;
        }
    };

    // Effect quản lý vòng đời
    useEffect(() => {
        if (open) {
            // Delay nhỏ để DOM render xong thẻ #reader
            const timer = setTimeout(() => {
                startScanner();
            }, 500);
            return () => {
                clearTimeout(timer);
                handleStop();
            };
        } else {
            handleStop();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={(val) => { if (!val) handleStop(); onOpenChange(val); }}>
            <DialogContent 
                className="sm:max-w-md p-0 overflow-hidden bg-black border-slate-800 text-white gap-0 focus:outline-none"
                // Ẩn nút X mặc định của Shadcn để tự custom đẹp hơn
                onInteractOutside={(e) => e.preventDefault()} 
            >
                {/* Custom Header */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent">
                    <div>
                        <DialogTitle className="text-white text-lg font-semibold">Quét mã vạch</DialogTitle>
                        <DialogDescription className="text-slate-300 text-xs">
                            Di chuyển camera vào mã sản phẩm
                        </DialogDescription>
                    </div>
                    <button 
                        onClick={() => onOpenChange(false)} 
                        className="bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm transition-colors"
                    >
                        <X size={20} className="text-white" />
                    </button>
                </div>

                {/* Khu vực Camera */}
                <div className="relative w-full aspect-[3/4] sm:aspect-square bg-zinc-950 flex flex-col justify-center overflow-hidden">
                    <div id="reader" className="w-full h-full [&>video]:object-cover"></div>

                    {/* Overlay hướng dẫn (Khung xanh) */}
                    {!isLoading && !error && (
                        <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
                            <div className="w-[250px] h-[250px] border-2 border-green-500 rounded-lg relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 animate-scan-line shadow-[0_0_10px_#22c55e]"></div>
                                {/* 4 Góc trang trí */}
                                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
                                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-900">
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                            <p className="text-slate-400 text-sm">Đang khởi động Camera...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-zinc-900 p-6 text-center">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                                <X size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-white font-semibold mb-2">Lỗi Camera</h3>
                            <p className="text-slate-400 text-sm mb-6">{error}</p>
                            <Button 
                                variant="secondary" 
                                onClick={() => startScanner()}
                                className="bg-white text-black hover:bg-slate-200"
                            >
                                <RefreshCcw className="mr-2 h-4 w-4" /> Thử lại
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}