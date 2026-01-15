// src/pages/staff/OutboundPickingPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw, Trash2, AlertTriangle } from "lucide-react";

// Components
import { useToast } from "@/hooks/use-toast";
import { PickingListView } from "@/components/outbound/picking/PickingListView";
import { PickingExecutionView } from "@/components/outbound/picking/PickingExecutionView";
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, 
    DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

// Services & Types
import { outboundForStaffService } from "@/services/outboundForStaff.service.ts";
import { PickingTask } from "@/types/outboundDetails";
import { LocalPickingResult } from "@/types/outbound.ts";

const OutboundPickingPage = () => {
    const { id } = useParams();
    const orderId = Number(id);
    const navigate = useNavigate();
    const { toast } = useToast();


    const [viewMode, setViewMode] = useState<'LIST' | 'EXECUTION'>('LIST');
    const [tasks, setTasks] = useState<PickingTask[]>([]);
    const [selectedTask, setSelectedTask] = useState<PickingTask | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // State cho Dialog Khôi phục
    const [showRestoreDialog, setShowRestoreDialog] = useState(false);
    const [pendingApiData, setPendingApiData] = useState<PickingTask[]>([]);
    const [pendingLocalData, setPendingLocalData] = useState<Record<number, LocalPickingResult> | null>(null);


    useEffect(() => {
        const initData = async () => {
            if (!orderId) return;
            setIsLoading(true);
            try {
                // A. Gọi API lấy danh sách gốc
                const apiTasks = await outboundForStaffService.getOrderDetail(orderId);

                // B. Kiểm tra Local Storage
                const savedSession = outboundForStaffService.getLocalResults(orderId);
                const hasLocalData = Object.keys(savedSession).length > 0;

                if (hasLocalData) {

                    setPendingApiData(apiTasks);
                    setPendingLocalData(savedSession);
                    setShowRestoreDialog(true); 
                } else {

                    setTasks(apiTasks);
                }

            } catch (error) {
                console.error(error);
                toast({ title: "Lỗi", description: "Không thể tải danh sách nhiệm vụ", variant: "destructive" });
            } finally {

                if (Object.keys(outboundForStaffService.getLocalResults(orderId)).length === 0) {
                    setIsLoading(false);
                }
            }
        };

        initData();
    }, [orderId, toast]);

    // --- 2. XỬ LÝ: KHÔI PHỤC DỮ LIỆU CŨ ---
    const handleRestore = () => {
        if (!pendingApiData || !pendingLocalData) return;

        // Trộn dữ liệu (Merge Logic)
        const mergedTasks = pendingApiData.map(task => {
            const savedResult = pendingLocalData[task.id];
            if (savedResult) {
                return {
                    ...task,
                    status: savedResult.isFlagged ? 'FLAGGED' : 'COMPLETED',
                    // pickedQty: savedResult.actualQty 
                } as PickingTask; // Ép kiểu nếu cần
            }
            return task;
        });

        setTasks(mergedTasks);
        setShowRestoreDialog(false);
        setIsLoading(false);
        toast({ title: "Đã khôi phục", description: "Tiếp tục phiên làm việc trước đó.", className: "bg-blue-100" });
    };

    // --- 3. XỬ LÝ: XÓA DỮ LIỆU CŨ (LÀM LẠI TỪ ĐẦU) ---
    const handleDiscard = () => {
        // Xóa LocalStorage
        outboundForStaffService.clearLocalSession(orderId);
        
        // Dùng dữ liệu gốc từ API
        setTasks(pendingApiData);
        
        setShowRestoreDialog(false);
        setIsLoading(false);
        toast({ title: "Đã làm mới", description: "Bắt đầu lại từ dữ liệu gốc.", variant: "default" });
    };

    // --- 4. XỬ LÝ KHI HOÀN THÀNH 1 TASK (Callback từ màn hình con) ---
    const handleTaskComplete = (status: 'COMPLETED' | 'FLAGGED', qty: number, note?: string) => {
        if (!selectedTask) return;

        const result: LocalPickingResult = {
            outboundDetailId: selectedTask.id,
            productId: selectedTask.productId,
            locationId: selectedTask.locationId || 0,
            actualQty: qty,
            isFlagged: status === 'FLAGGED',
            note: note,
            timestamp: Date.now()
        };

        // Cập nhật State UI
        setTasks(prev => prev.map(t => 
            t.id === selectedTask.id ? { ...t, status: status } : t
        ));

        // Lưu LocalStorage
        outboundForStaffService.saveLocalResult(orderId, result);

        setViewMode('LIST');
        setSelectedTask(null);
    };

    // --- 5. SUBMIT TẤT CẢ ---
    const handleSubmitAll = async () => {
        try {
            const sessionMap = outboundForStaffService.getLocalResults(orderId);
            const resultsArray = Object.values(sessionMap);

            if (resultsArray.length === 0) {
                toast({ title: "Lỗi", description: "Chưa có dữ liệu nào để gửi", variant: "destructive" });
                return;
            }

            await outboundForStaffService.submitBatchPicking(orderId, resultsArray);
            outboundForStaffService.clearLocalSession(orderId);

            toast({ title: "Thành công", description: "Đã hoàn thành đơn hàng!", className: "bg-green-100" });
            navigate("/staff/outbound");
            
        } catch (error) {
            console.error(error);
            toast({ title: "Lỗi", description: "Gửi dữ liệu thất bại. Vui lòng thử lại.", variant: "destructive" });
        }
    };

    // --- RENDER ---
    if (isLoading && !showRestoreDialog) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            {viewMode === 'LIST' ? (
                <PickingListView 
                    orderId={orderId.toString()}
                    tasks={tasks}
                    onBack={() => navigate("/staff/outbound")}
                    onSelectTask={(taskId) => {
                        const task = tasks.find(t => t.id === taskId);
                        if (task) {
                            setSelectedTask(task);
                            setViewMode('EXECUTION');
                        }
                    }}
                    onSubmit={handleSubmitAll}
                />
            ) : (
                selectedTask && (
                    <PickingExecutionView 
                        orderId={orderId}
                        task={selectedTask}
                        onBack={() => {
                            setViewMode('LIST');
                            setSelectedTask(null);
                        }}
                        onComplete={handleTaskComplete}
                    />
                )
            )}

            {/* --- DIALOG HỎI KHÔI PHỤC --- */}
            <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="w-5 h-5" />
                            Phát hiện tiến độ chưa lưu
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Hệ thống tìm thấy dữ liệu bạn đang làm dở cho đơn hàng này.
                            Bạn có muốn khôi phục lại trạng thái cũ không?
                        </DialogDescription>
                    </DialogHeader>

                    {pendingLocalData && (
                        <div className="bg-slate-100 p-3 rounded text-sm text-slate-700 font-medium">
                            Tìm thấy: {Object.keys(pendingLocalData).length} nhiệm vụ đã thực hiện.
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button 
                            variant="destructive" 
                            onClick={handleDiscard} 
                            className="flex-1 gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Bỏ qua & Làm mới
                        </Button>
                        <Button 
                            variant="default" 
                            onClick={handleRestore} 
                            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" /> Khôi phục
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default OutboundPickingPage;