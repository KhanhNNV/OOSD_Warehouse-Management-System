import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { outboundService } from "@/services/outbound.service";
import { PickingInstruction, ConfirmPickingRequest, LocationPickingDetail } from "@/types/outbound";
import { PickingTask as ExecutionTask } from "@/types/outboundDetails";
import { PickingExecutionView } from "@/components/outbound/picking/PickingExecutionView";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, 
  MapPin, 
  Package, 
  CheckCircle, 
  AlertCircle,
  ScanLine,
  ArrowLeft,
  ScanBarcode // <--- [MỚI] Import icon Scan
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function PickingInstructionPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [instruction, setInstruction] = useState<PickingInstruction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- MỚI: QUẢN LÝ TRẠNG THÁI PICKING ---
  const [viewMode, setViewMode] = useState<'LIST' | 'EXECUTION'>('LIST');
  const [selectedTask, setSelectedTask] = useState<ExecutionTask | null>(null);

  const STORAGE_KEY = `picking_instruction_results_${orderId}`;

  // Key format: `${productId}-${locationCode}`
  const [pickedResults, setPickedResults] = useState<Record<string, { qty: number, status: 'COMPLETED' | 'FLAGGED', note?: string }>>(() => {
    const saved = localStorage.getItem(`picking_instruction_results_${orderId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Tự động lưu kết quả vào localStorage
  useEffect(() => {
    if (orderId) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pickedResults));
    }
  }, [pickedResults, orderId, STORAGE_KEY]);

  // Fetch chỉ dẫn lấy hàng
  useEffect(() => {
    const fetchInstruction = async () => {
      if (!orderId) return;
      
      try {
        const data = await outboundService.getPickingInstruction(parseInt(orderId));
        setInstruction(data);
      } catch (error: any) {
        toast({
          title: "Lỗi kết nối",
          description: error.response?.data?.message || "Không thể tải chỉ dẫn",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstruction();
  }, [orderId]);

  // --- MỚI: XỬ LÝ SCAN ---
  const handleStartScan = (task: PickingInstruction["tasks"][0], loc: LocationPickingDetail, index: number) => {
    // Map sang format của PickingExecutionView
    const executionTask: ExecutionTask = {
      // Dùng ID mang tính định danh duy nhất trong đơn hàng này để PickingExecutionView có thể lưu session
      id: task.productId * 1000 + index,
      productId: task.productId,
      productName: task.productName,
      productSku: task.productSku,
      requestedQty: loc.qtyToPickFromHere,
      pickupQty: loc.qtyToPickFromHere,
      locationId: loc.locationId,
      locationCode: loc.locationCode,
      status: 'PENDING'
    };

    setSelectedTask(executionTask);
    setViewMode('EXECUTION');
  };

  const handleTaskComplete = (status: 'COMPLETED' | 'FLAGGED', qty: number, note?: string) => {
    if (!selectedTask) return;

    const key = `${selectedTask.productId}-${selectedTask.locationCode}`;
    setPickedResults(prev => ({
      ...prev,
      [key]: { qty, status, note }
    }));

    setViewMode('LIST');
    setSelectedTask(null);
  };

  // Xử lý xác nhận xuất kho
  const handleConfirm = async () => {
    if (!instruction) return;

    // Kiểm tra xem đã lấy hết chưa
    const totalLocations = instruction.tasks.reduce((sum, t) => sum + t.locations.length, 0);
    const completedCount = Object.keys(pickedResults).length;

    if (completedCount < totalLocations) {
      if (!confirm(`Bạn mới hoàn thành ${completedCount}/${totalLocations} vị trí. Vẫn muốn xác nhận?`)) {
        return;
      }
    }

    // Tạo payload từ kết quả thực tế
    const pickedItems: ConfirmPickingRequest["pickedItems"] = [];
    
    instruction.tasks.forEach(task => {
      task.locations.forEach(loc => {
        const key = `${task.productId}-${loc.locationCode}`;
        const result = pickedResults[key];

        pickedItems.push({
          productId: task.productId,
          locationCode: loc.locationCode,
          quantity: result ? result.qty : 0 // Nếu chưa scan thì coi như lấy 0 hoặc giữ nguyên? Ở đây lấy thực tế.
        });
      });
    });

    setIsSubmitting(true);
    try {
      await outboundService.confirmPicking({
        outboundOrderId: instruction.orderId,
        pickedItems
      });

      // Xóa dữ liệu tạm sau khi thành công
      localStorage.removeItem(STORAGE_KEY);

      toast({
        title: "Xuất kho thành công!",
        description: "Đơn hàng đã được xử lý và trừ tồn kho",
        className: "bg-green-600 text-white border-none"
      });

      // Đóng tab sau 2 giây
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Lỗi xuất kho",
        description: error.response?.data?.message || "Không thể hoàn tất xuất kho",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!instruction) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-lg font-semibold text-slate-700">Không tìm thấy chỉ dẫn</p>
        </div>
      </div>
    );
  }

  if (viewMode === 'EXECUTION' && selectedTask) {
    return (
      <div className="fixed inset-0 z-[150] bg-white">
        <PickingExecutionView
          orderId={instruction.orderId}
          task={selectedTask}
          onBack={() => setViewMode('LIST')}
          onComplete={handleTaskComplete}
        />
      </div>
    );
  }

  return (
    // [MỚI] Sử dụng fixed inset-0 z-[100] để phủ kín màn hình, che đi Sidebar và Header cũ
    <div className="fixed inset-0 z-[100] bg-slate-50 overflow-y-auto pb-32">
      {/* Header */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                CHỈ DẪN LẤY HÀNG
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Đơn hàng: <span className="font-mono font-semibold">{instruction.orderNumber}</span>
              </p>
            </div>

            {/* Algorithm Badge */}
            <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">
                Thuật toán
              </p>
              <p className="text-sm font-bold text-blue-700">
                {instruction.algorithm}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {instruction.tasks.map((task, taskIndex) => (
          <Card key={taskIndex} className="overflow-hidden border-2">
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 p-4 border-b">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-800">
                    {task.productName}
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    SKU: <span className="font-mono bg-white px-2 py-0.5 rounded border">{task.productSku}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Cần lấy</p>
                  <p className="text-3xl font-black text-blue-600">
                    {task.totalNeeded}
                  </p>
                </div>
              </div>
            </div>

            <CardContent className="p-0">
              {task.locations.map((loc, locIndex) => {
                const key = `${task.productId}-${loc.locationCode}`;
                const result = pickedResults[key];
                const isCompleted = !!result;

                return (
                <div 
                  key={locIndex}
                  className={cn(
                    "p-4 border-b last:border-b-0 transition-colors",
                    isCompleted ? "bg-green-50/50" : locIndex === 0 ? "bg-yellow-50/30" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Số thứ tự */}
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shrink-0",
                      locIndex === 0 
                        ? "bg-yellow-400 text-yellow-900 ring-4 ring-yellow-100" 
                        : "bg-slate-200 text-slate-600"
                    )}>
                      {locIndex + 1}
                    </div>

                    {/* Thông tin kệ */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className={cn(
                          "w-5 h-5",
                          locIndex === 0 ? "text-yellow-600" : "text-slate-500"
                        )} />
                        <span className="text-2xl font-black text-slate-800">
                          Kệ {loc.locationCode}
                        </span>
                      </div>

                      <div className="flex gap-4 text-xs text-slate-500">
                        {loc.manufactureDate && (
                          <div>
                            <span className="font-semibold">NSX:</span> {loc.manufactureDate}
                          </div>
                        )}
                        {loc.expiryDate && (
                          <div>
                            <span className="font-semibold">HSD:</span> {loc.expiryDate}
                          </div>
                        )}
                        <div>
                          <span className="font-semibold">Tồn:</span> {loc.availableQty}
                        </div>
                      </div>

                      {locIndex === 0 && (
                        <div className="mt-2 inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-bold">
                          <CheckCircle className="w-3 h-3" />
                          ƯU TIÊN LẤY TRƯỚC
                        </div>
                      )}
                    </div>
                      
                    {/* [MỚI] Nút Scan */}
                    <Button 
                      variant={isCompleted ? "ghost" : "outline"}
                      size="sm"
                      className={cn(
                        "shrink-0 gap-2 border-dashed",
                        isCompleted ? "text-green-600" : "border-blue-300 text-blue-600 hover:bg-blue-50"
                      )}
                      onClick={() => handleStartScan(task, loc, locIndex)}
                    >
                      {isCompleted ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Đã lấy
                        </>
                      ) : (
                        <>
                          <ScanBarcode className="w-4 h-4" />
                          Scan
                        </>
                      )}
                    </Button>

                    {/* Số lượng lấy */}
                    <div className="text-right min-w-[80px]">
                      <p className="text-xs text-slate-500 uppercase font-semibold">
                        {isCompleted ? "Thực lấy" : "Cần lấy"}
                      </p>
                      <p className={cn(
                        "text-4xl font-black",
                        isCompleted ? "text-green-600" : "text-blue-600"
                      )}>
                        {isCompleted ? result.qty : loc.qtyToPickFromHere}
                      </p>
                      {isCompleted && result.qty !== loc.qtyToPickFromHere && (
                        <p className="text-xs text-red-500 font-bold">
                          Thiếu: {loc.qtyToPickFromHere - result.qty}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer - Nút Scan */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30">
        <div className="max-w-5xl mx-auto p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-8">
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Tiến độ</p>
                <p className="text-2xl font-black text-blue-600">
                  {Object.keys(pickedResults).length}/{instruction.tasks.reduce((sum, t) => sum + t.locations.length, 0)} vị trí
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-semibold">Tổng sản phẩm</p>
                <p className="text-2xl font-black text-slate-800">
                  {instruction.tasks.reduce((sum, task) => sum + task.totalNeeded, 0)}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => window.close()}
                disabled={isSubmitting}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại
              </Button>
              
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Xác nhận đã lấy hàng
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Chú thích */}
          <div className="mt-3 p-3 bg-slate-50 rounded-lg flex items-start gap-2">
            <ScanLine className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
            <p className="text-xs text-slate-600 leading-relaxed">
              <strong>Hướng dẫn:</strong> Đi theo thứ tự từ trên xuống dưới, lấy đúng số lượng từ mỗi kệ. 
              Sau khi lấy xong TẤT CẢ, nhấn nút "Xác nhận" để trừ tồn kho.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}