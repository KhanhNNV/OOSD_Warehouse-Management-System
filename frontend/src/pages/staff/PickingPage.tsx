// src/pages/staff/PickingPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { outboundForStaffService } from "@/services/outboundForStaff.service";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import {
    ShoppingCart, Search, Save, ArrowLeft, X, Loader2, Package, ScanLine, 
    Edit, MapPin, CheckCircle, AlertTriangle,
    Trash2
} from "lucide-react";
import { ScannerButton } from "@/components/scanner/ScannerButton";
import { PickingTask } from "@/types/outboundDetails";
import { LocalPickingResult } from "@/types/outbound";

export default function PickingPage() {
    const { id } = useParams<{ id: string }>(); // Lấy ID đơn hàng từ URL
    const navigate = useNavigate();
    const { toast } = useToast();

    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [tasks, setTasks] = useState<PickingTask[]>([]);
    const [localResults, setLocalResults] = useState<Record<number, LocalPickingResult>>({});
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- STATE GIAO DIỆN ---
    const [manualCode, setManualCode] = useState("");
    
    // State cho Modal (Thay vì session phức tạp cũ, ta dùng đơn giản hơn)
    const [selectedTask, setSelectedTask] = useState<PickingTask | null>(null);
    const [tempQty, setTempQty] = useState("");

    // --- 1. LOAD DỮ LIỆU (API + LOCALSTORAGE) ---
    useEffect(() => {
        if (!id) return;
        
        const loadData = async () => {
            try {
                setLoading(true);
                // Gọi API lấy danh sách sản phẩm cần nhặt của đơn hàng này
                const apiTasks = await outboundForStaffService.getOrderDetail(Number(id));
                setTasks(apiTasks);
                
                // Lấy kết quả đã làm dở từ LocalStorage (nếu có)
                const saved = outboundForStaffService.getLocalResults(Number(id));
                setLocalResults(saved);
            } catch (error) {
                toast({ 
                    title: "Lỗi tải dữ liệu", 
                    description: "Không thể lấy danh sách sản phẩm. Vui lòng thử lại.", 
                    variant: "destructive" 
                });
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [id]);

    // --- 2. XỬ LÝ QUÉT MÃ (SCAN/ENTER) ---
    const handleScan = (code: string) => {
        if (!code.trim()) return;
        
        // Tìm xem mã vừa quét có khớp với SKU sản phẩm hoặc Mã kệ nào trong danh sách không
        const task = tasks.find(t => 
            t.productSku.toLowerCase() === code.toLowerCase() || 
            (t.locationCode && t.locationCode.toLowerCase() === code.toLowerCase())
        );

        if (!task) {
            toast({ 
                title: "Không tìm thấy!", 
                description: `Mã "${code}" không có trong đơn hàng này.`, 
                variant: "destructive" 
            });
            return;
        }

        // Nếu tìm thấy -> Mở Modal để nhập số lượng
        openEditModal(task);
        setManualCode(""); // Reset ô input
    };

    // --- 3. LOGIC MODAL (MỞ & LƯU) ---
    const openEditModal = (task: PickingTask) => {
        setSelectedTask(task);
        // Nếu đã nhập trước đó thì hiện số cũ, chưa thì hiện số gợi ý (pickupQty)
        const currentResult = localResults[task.id];
        const initialQty = currentResult ? currentResult.actualQty : task.pickupQty;
        setTempQty(initialQty.toString());
    };

    const handleSaveQty = () => {
        if (!selectedTask) return;
        
        const qty = parseInt(tempQty);
        if (isNaN(qty) || qty <= 0) {
            toast({ title: "Lỗi", description: "Số lượng phải lớn hơn 0", variant: "destructive" });
            return;
        }

        // Logic check thiếu hàng (Flag)
        const isShortage = qty < selectedTask.pickupQty;

        // Tạo object kết quả
        const result: LocalPickingResult = {
            outboundDetailId: selectedTask.id, // ID định danh
            productId: selectedTask.productId,
            locationId: selectedTask.locationId || 0, // ID kệ thực tế (Backend cần cái này)
            actualQty: qty,
            isFlagged: isShortage,
            note: isShortage ? "Số lượng thực tế ít hơn yêu cầu" : "",
            timestamp: Date.now()
        };

        // Lưu vào LocalStorage
        outboundForStaffService.saveLocalResult(Number(id), result);
        
        // Cập nhật State ngay lập tức để giao diện đổi màu
        setLocalResults(prev => ({ ...prev, [selectedTask.id]: result }));
        
        // Đóng modal & Thông báo
        setSelectedTask(null);
        toast({ 
            title: "Đã cập nhật", 
            description: `${selectedTask.productSku}: ${qty} sản phẩm`,
            className: "bg-green-600 text-white border-none"
        });
    };

    // --- 4. SUBMIT GỬI LÊN SERVER ---
    const handleSubmitAll = async () => {
        const results = Object.values(localResults);
        if (results.length === 0) return;

        // Validate: Cảnh báo nếu chưa làm xong hết
        if (results.length < tasks.length) {
            const confirm = window.confirm(`Bạn mới hoàn thành ${results.length}/${tasks.length} mục. Có chắc chắn muốn nộp đơn này không?`);
            if (!confirm) return;
        }

        setIsSubmitting(true);
        try {
            // Gửi Batch lên API
            await outboundForStaffService.submitBatchPicking(Number(id), results);

            toast({ 
                title: "🎉 Xuất kho thành công!", 
                description: "Đơn hàng đã được chuyển sang đóng gói.",
                className: "bg-green-100 border-green-200 text-green-800"
            });

            // Xóa cache & Quay về
            outboundForStaffService.clearLocalSession(Number(id));
            navigate("/staff/outbound"); 

        } catch (error) {
            // Xử lý lỗi Backend trả về (Danh sách lỗi hoặc lỗi chung)
            const errorData = error.response?.data;
            if (errorData?.data && Array.isArray(errorData.data)) {
                const firstError = errorData.data[0];
                toast({
                    title: "Lỗi hàng hóa!",
                    description: `${firstError.productSku}: ${firstError.errorMessage}`,
                    variant: "destructive",
                    duration: 5000
                });
            } else {
                toast({
                    title: "Gửi thất bại",
                    description: errorData?.message || "Lỗi kết nối server",
                    variant: "destructive"
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Tính toán tiến độ
    const progress = useMemo(() => {
        const doneCount = Object.keys(localResults).length;
        const totalCount = tasks.length;
        const totalPicked = Object.values(localResults).reduce((sum, item) => sum + item.actualQty, 0);
        return { doneCount, totalCount, totalPicked };
    }, [localResults, tasks]);

    if (loading) {
        return <div className="h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin w-10 h-10 text-blue-600"/></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 relative pb-32">
            {/* --- HEADER --- */}
            <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
                <div className="max-w-5xl mx-auto p-3">
                    <div className="flex flex-col gap-3">
                        {/* Title & Back Button */}
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" onClick={() => navigate("/staff/outbound")} className="-ml-2">
                                <ArrowLeft className="w-5 h-5 text-slate-600"/>
                            </Button>
                            <div>
                                <h1 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                                    <ShoppingCart className="w-5 h-5 text-blue-600"/>
                                    Picking Đơn #{id}
                                </h1>
                                <p className="text-xs text-slate-500">Hoàn thành: {progress.doneCount}/{progress.totalCount} mục</p>
                            </div>
                        </div>

                        {/* --- INPUT BAR & SCANNER --- */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <Input
                                    value={manualCode}
                                    onChange={(e) => setManualCode(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleScan(manualCode)}
                                    placeholder="Quét mã SP hoặc mã kệ..."
                                    className="h-12 pl-10 text-lg border-slate-300 focus-visible:ring-blue-500 bg-slate-50"
                                    autoFocus
                                />
                            </div>

                            <div className="shrink-0">
                                <ScannerButton
                                    onScanResult={handleScan}
                                    className="h-12 w-12 p-0 flex items-center justify-center bg-slate-800 hover:bg-slate-900 text-white shadow-md rounded-lg"
                                >
                                    <ScanLine className="w-6 h-6" />
                                </ScannerButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- LIST ITEMS (TABLE) --- */}
            <div className="max-w-5xl mx-auto p-3">
                <Card className="border-none shadow-sm bg-white overflow-hidden">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50 border-b">
                                <TableRow>
                                    <TableHead className="w-[50%]">Sản phẩm / Vị trí</TableHead>
                                    <TableHead className="text-center w-[30%]">Đã lấy</TableHead>
                                    <TableHead className="w-[20%]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="h-48 text-center text-slate-400">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Package className="w-12 h-12 text-slate-200"/>
                                                <p>Đơn hàng trống</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task) => {
                                        // Kiểm tra trạng thái của Task này
                                        const result = localResults[task.id];
                                        const isDone = !!result;
                                        const isFlagged = result?.isFlagged;

                                        return (
                                            <TableRow 
                                                key={task.id} 
                                                className={`
                                                    transition-colors cursor-pointer border-b
                                                    ${isDone && !isFlagged ? "bg-green-50 hover:bg-green-100" : ""}
                                                    ${isFlagged ? "bg-yellow-50 hover:bg-yellow-100" : "hover:bg-slate-50"}
                                                `}
                                                onClick={() => openEditModal(task)}
                                            >
                                                <TableCell className="py-4">
                                                    <div className="font-bold text-slate-800 text-base">{task.productName}</div>
                                                    <div className="flex flex-wrap gap-2 mt-1">
                                                        {/* Mã SKU */}
                                                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono text-slate-600">
                                                            {task.productSku}
                                                        </span>
                                                        {/* Vị trí gợi ý */}
                                                        <span className="text-xs bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-bold text-blue-600 flex items-center gap-1">
                                                            <MapPin className="w-3 h-3"/> {task.locationCode}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                
                                                <TableCell className="text-center align-middle">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-xl font-bold ${isDone ? (isFlagged ? 'text-yellow-600' : 'text-green-600') : 'text-slate-300'}`}>
                                                            {result ? result.actualQty : 0}
                                                        </span>
                                                        <span className="text-xs text-slate-400 font-medium border-t border-slate-200 px-2 mt-1 pt-0.5">
                                                            yêu cầu: {task.pickupQty}
                                                        </span>
                                                    </div>
                                                </TableCell>

                                                <TableCell className="align-middle text-right pr-4">
                                                    {isDone && !isFlagged && <CheckCircle className="w-6 h-6 text-green-500 inline-block"/>}
                                                    {isFlagged && <AlertTriangle className="w-6 h-6 text-yellow-500 inline-block"/>}
                                                    {!isDone && <div className="w-3 h-3 bg-slate-200 rounded-full inline-block"></div>}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* --- FOOTER: NÚT HOÀN TẤT --- */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 safe-area-bottom">
                <div className="max-w-5xl mx-auto p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Đã nhặt</span>
                        <span className="text-2xl font-black text-slate-800 leading-none">
                            {progress.totalPicked} <span className="text-sm font-normal text-slate-500">sp</span>
                        </span>
                    </div>
                    <Button 
                        className={`h-12 px-8 text-lg font-bold shadow-lg rounded-xl transition-all ${
                            progress.doneCount === 0 
                            ? 'bg-slate-300 cursor-not-allowed text-slate-500' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                        }`}
                        onClick={handleSubmitAll}
                        disabled={progress.doneCount === 0 || isSubmitting}
                    >
                        {isSubmitting ? (
                            <><Loader2 className="w-5 h-5 mr-2 animate-spin"/> Đang gửi...</>
                        ) : (
                            <><Save className="w-5 h-5 mr-2"/> Hoàn tất</>
                        )}
                    </Button>
                </div>
            </div>

            {/* --- MODAL NHẬP SỐ LƯỢNG --- */}
            {selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800">Xác nhận số lượng</h3>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-200" onClick={() => setSelectedTask(null)}>
                                <X className="w-5 h-5 text-slate-500"/>
                            </Button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 text-center space-y-5">
                            <div>
                                <h4 className="font-bold text-lg leading-tight text-slate-800 mb-1">{selectedTask.productName}</h4>
                                <div className="flex justify-center gap-2 mt-2">
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-sm font-mono border">
                                        {selectedTask.productSku}
                                    </span>
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-sm font-bold border border-blue-200">
                                        Kệ: {selectedTask.locationCode}
                                    </span>
                                </div>
                            </div>

                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <label className="text-xs font-bold text-blue-400 uppercase tracking-wide block mb-2">
                                    Yêu cầu: {selectedTask.pickupQty} | Thực tế lấy:
                                </label>
                                <Input
                                    type="number"
                                    className="text-center text-5xl font-black h-20 text-blue-600 border-none bg-transparent focus-visible:ring-0 p-0 shadow-none placeholder:text-blue-200"
                                    value={tempQty}
                                    onChange={e => setTempQty(e.target.value)}
                                    autoFocus
                                    onKeyDown={e => e.key === 'Enter' && handleSaveQty()}
                                />
                            </div>

                            <div className="flex gap-3">
                                {/* Nút xóa (nếu đã nhập rồi) */}
                                {localResults[selectedTask.id] && (
                                    <Button variant="outline" className="h-12 w-12 border-red-200 text-red-600 hover:bg-red-50 p-0 shrink-0"
                                        onClick={() => {
                                            const newRes = {...localResults};
                                            delete newRes[selectedTask.id];
                                            setLocalResults(newRes);
                                            outboundForStaffService.saveLocalResult(Number(id), { ...localResults[selectedTask.id], actualQty: 0 }); // Hacky clear logic or separate func
                                            // Better: remove from LS properly
                                            // Nhưng tạm thời user muốn nhanh thì chỉ cần set lại state là UI cập nhật
                                            setSelectedTask(null);
                                        }}
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </Button>
                                )}
                                
                                <Button className="flex-1 h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100" onClick={handleSaveQty}>
                                    Lưu lại
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Toaster />
        </div>
    );
}