import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { stocktakeService } from "@/services/stocktake.service";
import { CountingItem, SubmitCountsRequest } from "@/types/stocktake";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Package, X } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";

export default function StocktakeCounting() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<CountingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State cho Modal/Drawer
  const [selectedItem, setSelectedItem] = useState<CountingItem | null>(null);
  const [inputQty, setInputQty] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Load dữ liệu
  useEffect(() => {
    if (!id) return;
    const loadData = async () => {
      try {
        const res = await stocktakeService.startAssignment(Number(id));
        const mappedData: CountingItem[] = res.data.map(i => ({
          ...i,
          actualQty: null,
          isCounted: false
        }));
        setItems(mappedData);
      } catch (error) {
        toast({ title: "Lỗi tải dữ liệu", variant: "destructive" });
        navigate("/staff/stocktake");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, navigate]);

  // Focus vào ô input mỗi khi mở Drawer
  useEffect(() => {
    if (selectedItem && inputRef.current) {
        // Delay nhẹ để Drawer kịp render animation
        setTimeout(() => {
            inputRef.current?.focus();
        }, 150);
    }
  }, [selectedItem]);

  const pendingList = useMemo(() => items.filter(i => !i.isCounted), [items]);
  const completedList = useMemo(() => items.filter(i => i.isCounted), [items]);

  const handleItemClick = (item: CountingItem) => {
    setSelectedItem(item);
    // Nếu đã đếm rồi thì hiện số cũ, chưa thì để trống cho dễ nhập
    setInputQty(item.actualQty !== null ? String(item.actualQty) : "");
  };

  const handleConfirmQty = () => {
    if (!selectedItem) return;
    
    // Nếu để trống mà bấm xác nhận -> Coi như là 0 hoặc không hợp lệ? 
    // Ở đây ta bắt buộc nhập số. Nếu muốn nhập 0 phải gõ số 0.
    if (inputQty === "") {
        inputRef.current?.focus();
        return;
    }

    const qty = parseInt(inputQty);
    if (isNaN(qty) || qty < 0) {
      toast({ title: "Số lượng không hợp lệ", variant: "destructive" });
      return;
    }

    setItems(prev => prev.map(item => {
      if (item.detailId === selectedItem.detailId) {
        return { ...item, actualQty: qty, isCounted: true };
      }
      return item;
    }));

    setSelectedItem(null);
    toast({ 
        title: "Đã lưu", 
        description: `${selectedItem.productName}: ${qty} ${selectedItem.unit || ''}`, 
        duration: 1000 
    });
  };

  const handleSubmitAll = async () => {
    if (!id) return;
    const confirm = window.confirm("Bạn chắc chắn muốn hoàn tất và nộp kết quả?");
    if (!confirm) return;

    try {
      const payload: SubmitCountsRequest = {
        items: items.map(i => ({
          detailId: i.detailId,
          actualQty: i.actualQty || 0
        }))
      };

      await stocktakeService.completeAssignment(Number(id), payload);
      toast({ title: "Hoàn tất thành công!", className: "bg-green-500 text-white" });
      navigate("/staff/stocktake");
    } catch (error) {
      toast({ title: "Lỗi khi nộp bài", variant: "destructive" });
    }
  };

  if (isLoading) return <div className="p-5 text-center pt-20">Đang tải dữ liệu...</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-3 shadow-sm flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="-ml-2" onClick={() => navigate("/staff/stocktake")}>
            <ArrowLeft className="w-6 h-6 text-gray-700" />
            </Button>
            <div>
                <h1 className="font-bold text-gray-900 leading-tight">Kiểm kê kệ</h1>
                <p className="text-xs text-gray-500">
                    Đã đếm: <span className="text-blue-600 font-bold">{completedList.length}/{items.length}</span>
                </p>
            </div>
        </div>
      </div>

      {/* List Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 pb-32">
        {/* Phần cần đếm */}
        {pendingList.length > 0 && (
            <div className="grid grid-cols-1 gap-3">
                {pendingList.map(item => (
                <ItemCard key={item.detailId} item={item} onClick={() => handleItemClick(item)} />
                ))}
            </div>
        )}

        {/* Empty State khi xong hết */}
        {pendingList.length === 0 && items.length > 0 && (
            <div className="flex flex-col items-center justify-center py-10 text-center animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Check className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Tuyệt vời!</h3>
                <p className="text-gray-500">Bạn đã kiểm tra hết sản phẩm.</p>
            </div>
        )}

        {/* Phần đã hoàn thành */}
        {completedList.length > 0 && (
          <div className="space-y-3">
            <div className="relative py-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-300" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-50 px-2 text-gray-500 font-medium">Đã xong ({completedList.length})</span></div>
            </div>
            <div className="opacity-75 grayscale-[0.5]">
                {completedList.map(item => (
                <ItemCard key={item.detailId} item={item} onClick={() => handleItemClick(item)} isDone />
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Submit - CHỈ HIỆN KHI XONG HẾT */}
      {pendingList.length === 0 && items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.1)] z-20 animate-in slide-in-from-bottom duration-300">
            <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md"
                onClick={handleSubmitAll}
            >
                Hoàn tất & Nộp bài
            </Button>
        </div>
      )}

      {/* DRAWER NHẬP SỐ LƯỢNG - TỐI ƯU MOBILE */}
      <Drawer open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DrawerContent className="max-h-[90vh]">
           {selectedItem && (
             <div className="mx-auto w-full max-w-md flex flex-col h-full">
                
                {/* Header Drawer: Tên sản phẩm + Nút đóng */}
                <DrawerHeader className="flex justify-between items-start pb-2 px-4 pt-4">
                    <div className="text-left pr-4">
                         <DrawerTitle className="text-lg font-bold text-gray-900 line-clamp-2">
                            {selectedItem.productName}
                         </DrawerTitle>
                         <p className="text-sm font-mono text-gray-500 mt-1">{selectedItem.productSku}</p>
                    </div>
                    {/* Nút đóng nhanh góc phải */}
                    <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-gray-400" onClick={() => setSelectedItem(null)}>
                        <X className="w-5 h-5" />
                    </Button>
                </DrawerHeader>
                
                <div className="p-4 space-y-6">
                    {/* Thông tin phụ: Code + Date (Gọn gàng) */}
                    <div className="flex gap-2 text-sm">
                        <div className="flex-1 bg-blue-50 p-2.5 rounded-lg border border-blue-100 text-center">
                            <span className="text-[10px] uppercase text-blue-500 font-bold block mb-0.5">Vị trí</span>
                            <span className="font-bold text-gray-900 text-base">{selectedItem.locationCode}</span>
                        </div>
                        <div className="flex-1 bg-orange-50 p-2.5 rounded-lg border border-orange-100 text-center">
                            <span className="text-[10px] uppercase text-orange-500 font-bold block mb-0.5">Hạn sử dụng</span>
                            <span className="font-bold text-gray-900 text-base">
                                {selectedItem.expiryDate ? selectedItem.expiryDate : "--/--"}
                            </span>
                        </div>
                    </div>

                    {/* INPUT NHẬP SỐ LƯỢNG - FOCUS POINT */}
                    <div>
                        <label className="block text-center text-sm font-medium text-gray-500 mb-3">Nhập số lượng thực tế</label>
                        <div className="relative max-w-[200px] mx-auto">
                            <Input 
                                ref={inputRef}
                                type="number" 
                                inputMode="numeric" 
                                pattern="[0-9]*"
                                className="text-5xl h-24 text-center font-bold border-2 border-blue-500 rounded-2xl shadow-sm focus-visible:ring-4 focus-visible:ring-blue-100 focus-visible:border-blue-600 transition-all placeholder:text-gray-200"
                                value={inputQty}
                                onChange={(e) => setInputQty(e.target.value)}
                                placeholder="0"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleConfirmQty();
                                }}
                            />
                            {/* Đơn vị tính floating bên phải */}
                            {selectedItem.productUnit && (
                                <span className="absolute right-2 bottom-2 text-gray-400 text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">
                                    {selectedItem.productUnit}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Drawer: Chỉ 1 nút XÁC NHẬN to đùng */}
                <DrawerFooter className="pt-2 pb-6 px-4">
                    <Button 
                        className="h-14 w-full text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-md active:scale-[0.98] transition-transform" 
                        onClick={handleConfirmQty}
                    >
                        XÁC NHẬN
                    </Button>
                </DrawerFooter>
             </div>
           )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// Component thẻ con
function ItemCard({ item, onClick, isDone }: { item: CountingItem, onClick: () => void, isDone?: boolean }) {
    return (
        <div 
            onClick={onClick}
            className={`
                relative overflow-hidden
                p-3 rounded-xl border flex gap-3 items-center active:scale-[0.99] transition-all
                ${isDone 
                    ? 'bg-white border-green-200 shadow-none' 
                    : 'bg-white border-gray-200 shadow-sm hover:border-blue-300'
                }
            `}
        >
            {/* Dải màu trạng thái bên trái */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDone ? 'bg-green-500' : 'bg-blue-500'}`} />

            {/* Ảnh */}
            <div className="w-14 h-14 bg-gray-100 rounded-lg flex-shrink-0 border flex items-center justify-center overflow-hidden">
                {item.productImage ? (
                    <img src={item.productImage} className="w-full h-full object-cover" alt="" />
                ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pl-1">
                <h4 className={`font-semibold text-sm leading-snug ${isDone ? 'text-gray-500' : 'text-gray-900'}`}>
                    {item.productName}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-5 font-mono text-gray-500 border-gray-300">
                        {item.productSku}
                    </Badge>
                </div>
            </div>

            {/* Số lượng / Nút */}
            <div className="flex-shrink-0">
                {isDone ? (
                    <div className="flex flex-col items-end">
                        <span className="text-xs text-gray-400 mb-0.5">Thực tế</span>
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-sm h-7 px-2">
                             {item.actualQty}
                        </Badge>
                    </div>
                ) : (
                    <Button size="icon" variant="secondary" className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100">
                        +
                    </Button>
                )}
            </div>
        </div>
    )
}