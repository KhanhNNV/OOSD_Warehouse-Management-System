import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Loader2, ArrowLeft, Layers, MapPin, Package, 
  Container, ArrowRightLeft, ExternalLink // Icon mới cho nút chuyển khu
} from "lucide-react";
import { inventoryManagerService, getProductImageUrl, InventoryDetail, ShelfStat } from "@/services/inventoryManager.service";

// Helper màu kệ (Chỉ dùng cho khu vực lưu trữ)
const getShelfColorStyle = (qty: number) => {
  if (qty === 0) return "bg-slate-50 border-slate-200 text-slate-400";
  if (qty <= 10) return "bg-red-50 border-red-200 text-red-700 hover:bg-red-100 hover:border-red-300";
  if (qty <= 20) return "bg-yellow-50 border-yellow-200 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-300";
  return "bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300";
};

// [MỚI] Giả lập Mapping từ DB: Prefix SKU -> Zone (Khu vực)
// Trong thực tế, bạn có thể gọi API để lấy cấu hình này nếu cần chính xác tuyệt đối
const SKU_ZONE_MAP: Record<string, string> = {
    "DO": "A", // Đồ uống -> Khu A
    "BK": "B", // Bánh kẹo -> Khu B
    "DD": "C", // Đồ dùng -> Khu C
    // Thêm các rule khác tùy ý
};

export default function InventoryPage() {
  // --- STATE ---
  const [view, setView] = useState<"ZONES" | "SHELVES" | "BINS">("ZONES");
  const [loading, setLoading] = useState(false);
  
  const [zones, setZones] = useState<{ zoneName: string }[]>([]);
  const [currentZone, setCurrentZone] = useState<string>("");
  
  const [shelves, setShelves] = useState<ShelfStat[]>([]);
  const [currentShelf, setCurrentShelf] = useState<string>("");
  
  const [binInventory, setBinInventory] = useState<InventoryDetail[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<InventoryDetail | null>(null);

  useEffect(() => { loadZones(); }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await inventoryManagerService.getZones();
      setZones(data);
    } catch (error) { console.error("Lỗi load zones", error); } 
    finally { setLoading(false); }
  };

  // --- LOGIC CHỌN ZONE ---
  const handleSelectZone = async (zoneCode: string) => {
    setCurrentZone(zoneCode);
    setLoading(true);
    try {
      // Nếu là STAGE -> Vào thẳng danh sách hàng (BINS), bỏ qua chọn kệ
      if (zoneCode === 'STAGE') {
        const data = await inventoryManagerService.getShelfInventory(zoneCode, 'ALL');
        setBinInventory(data);
        setCurrentShelf('Khu vực Chờ (STAGE)'); 
        setView("BINS"); 
      } 
      else {
        // Logic cũ cho các Zone A, B, C
        const statsMap = await inventoryManagerService.getShelfStats(zoneCode);
        const shelvesData: ShelfStat[] = Object.entries(statsMap).map(([code, qty]) => ({
          code, quantity: qty
        })).sort((a, b) => a.code.localeCompare(b.code));
        setShelves(shelvesData);
        setView("SHELVES");
      }
    } catch (error) {
      console.error("Lỗi load data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShelf = async (shelfCode: string) => {
    setCurrentShelf(shelfCode);
    setLoading(true);
    try {
      const data = await inventoryManagerService.getShelfInventory(currentZone, shelfCode);
      setBinInventory(data);
      setView("BINS");
    } catch (error) { console.error("Lỗi load inventory", error); } 
    finally { setLoading(false); }
  };

  const handleBack = () => {
    if (view === "BINS") {
        if (currentZone === 'STAGE') setView("ZONES");
        else setView("SHELVES");
    }
    else if (view === "SHELVES") setView("ZONES");
  };

  // [MỚI] Hàm lấy Zone gợi ý từ SKU
  const getTargetZone = (sku: string) => {
      // Lấy 2 chữ cái đầu (VD: DO1 -> DO)
      const prefix = sku.substring(0, 2).toUpperCase();
      return SKU_ZONE_MAP[prefix] || "?"; // Trả về A, B hoặc ? nếu ko tìm thấy
  };

  // --- RENDERERS ---

  // 1. ZONE LIST
  const renderZones = () => {
    const stageZone = zones.find(z => z.zoneName === 'STAGE');
    const storageZones = zones.filter(z => z.zoneName !== 'STAGE');

    return (
      <div className="space-y-8">
        {/* PHẦN STAGE NỔI BẬT */}
        {stageZone && (
          <div className="animate-in slide-in-from-top-4 fade-in duration-500">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Container className="w-4 h-4" /> Khu vực Nhận & Xuất hàng
            </h3>
            
            <div 
              onClick={() => handleSelectZone('STAGE')}
              className="relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100 border-2 border-orange-200 p-6 hover:shadow-lg hover:border-orange-400 transition-all duration-300"
            >
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-orange-600 shadow-sm group-hover:scale-110 transition-transform">
                    <ArrowRightLeft className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
                      Khu vực STAGE
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">Xem tất cả hàng đang chờ xử lý</p>
                  </div>
                </div>
                
                <Button className="bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200 shadow-lg border-0">
                  Xem danh sách <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* PHẦN CÁC ZONE KHÁC (Style Card Cũ) */}
        <div>
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Layers className="w-4 h-4" /> Khu vực Lưu trữ (Storage)
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {storageZones.map((z) => (
              <Card 
                key={z.zoneName} 
                onClick={() => handleSelectZone(z.zoneName)}
                className="cursor-pointer hover:shadow-lg transition-all border-l-4 border-l-blue-500 hover:bg-blue-50"
              >
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <MapPin className="w-8 h-8 text-blue-500 mb-2" />
                  <h3 className="font-bold text-2xl text-slate-700">{z.zoneName}</h3>
                  <span className="text-xs text-slate-400 mt-1">Khu vực</span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // 2. SHELF LIST
  const renderShelves = () => (
    <div>
      <div className="flex gap-6 mb-8 justify-center">
        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-red-500"></span> &le; 10 SP</div>
        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> 10-20 SP</div>
        <div className="flex items-center gap-2 text-sm"><span className="w-3 h-3 rounded-full bg-green-500"></span> &gt; 20 SP</div>
      </div>
      
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-8 gap-4">
        {shelves.map((s) => (
          <div
            key={s.code}
            onClick={() => handleSelectShelf(s.code)}
            className={`
              cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center justify-center transition-all h-24 shadow-sm
              ${getShelfColorStyle(s.quantity)}
            `}
          >
            <Layers className="w-6 h-6 mb-1 opacity-70" />
            <span className="font-bold text-lg">Kệ {s.code}</span>
            <span className="text-xs font-semibold">SL: {s.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 3. TABLE DANH SÁCH
  const renderBins = () => (
    <Card className="shadow-sm border-slate-200">
      <CardContent className="p-0">
        <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-slate-700">
             {currentZone === 'STAGE' 
                ? 'Toàn bộ hàng đang ở Khu vực Chờ (STAGE)' 
                : `Danh sách sản phẩm trong Kệ ${currentShelf} (Khu ${currentZone})`
             }
          </h3>
          <Badge variant={currentZone === 'STAGE' ? 'default' : 'outline'} className={currentZone === 'STAGE' ? 'bg-orange-500' : ''}>
            Tổng: {binInventory?.length || 0} mục
          </Badge>
        </div>
        
        {(!binInventory || binInventory.length === 0) ? (
          <div className="text-center py-12 text-slate-400 flex flex-col items-center">
            <Package className="w-12 h-12 mb-2 opacity-20" />
            <span>Khu vực trống</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">{currentZone === 'STAGE' ? 'Khu vực lưu trữ' : 'Vị trí (Ô)'}</TableHead>
                <TableHead className="w-[80px]">Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Mã SP</TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead>Hạn sử dụng</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {binInventory.map((item) => {
                const targetZone = getTargetZone(item.product.sku); // Lấy khu vực mục tiêu (A, B...)
                return (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell>
                    {currentZone === 'STAGE' ? (
                        // [LOGIC MỚI] Nếu ở STAGE thì hiện nút chuyển đến Khu A/B
                        <Button 
                            variant="outline" 
                            size="sm"
                            className="h-8 gap-2 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300"
                            onClick={() => handleSelectZone(targetZone)} // Chuyển hướng khi click
                        >
                            Khu {targetZone} <ExternalLink className="w-3 h-3" />
                        </Button>
                    ) : (
                        // Nếu ở kệ thường thì hiện mã vị trí (A-01-01)
                        <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="font-bold font-mono text-slate-700">{item.location.code}</span>
                        </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.product.imageUrl ? (
                      <img 
                        src={getProductImageUrl(item.product.imageUrl)} 
                        alt="Img" 
                        className="w-10 h-10 object-contain rounded border bg-white"
                        onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/40x40?text=Error"; }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center border">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-700">{item.product.name}</TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="font-bold text-sm">
                      {item.quantity} {item.product.unit}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">{item.expiryDate || "-"}</TableCell>
                  
                  {/* CỘT HÀNH ĐỘNG - Chỉ giữ lại nút Chi tiết, bỏ nút Cất hàng */}
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedProduct(item)} className="text-slate-500 hover:text-blue-600">
                        Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          {view !== "ZONES" && (
            <Button variant="outline" size="icon" onClick={handleBack} className="bg-white">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          )}
          
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              Quản lý Tồn kho
            </h1>
            <div className="text-sm text-slate-500 flex gap-2 items-center mt-1">
               <span className={view === 'ZONES' ? 'font-bold text-blue-600' : ''}>Tổng quan</span>
               {view !== 'ZONES' && (
                 <>
                   <span>/</span>
                   <span className={view === 'SHELVES' && currentZone !== 'STAGE' ? 'font-bold text-blue-600' : ''}>
                     {currentZone === 'STAGE' ? 'Khu vực STAGE' : `Khu ${currentZone}`}
                   </span>
                 </>
               )}
               {view === 'BINS' && currentZone !== 'STAGE' && (
                 <>
                   <span>/</span>
                   <span className="font-bold text-blue-600">Kệ {currentShelf}</span>
                 </>
               )}
            </div>
          </div>
        </div>
        {loading && <div className="flex items-center gap-2 text-blue-600"><Loader2 className="w-5 h-5 animate-spin" /> <span className="text-sm font-medium">Đang tải...</span></div>}
      </div>

      {/* Main Content */}
      <div className="animate-in fade-in duration-500 slide-in-from-bottom-2 pb-20">
        {view === "ZONES" && renderZones()}
        {view === "SHELVES" && renderShelves()}
        {view === "BINS" && renderBins()}
      </div>

      {/* Modal Detail giữ nguyên như cũ */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Chi tiết sản phẩm</DialogTitle></DialogHeader>
          {selectedProduct && (
            <div className="grid gap-6 py-4">
              <div className="flex justify-center bg-slate-50 p-6 rounded-xl border border-dashed">
                {selectedProduct.product.imageUrl ? (
                  <img 
                    src={getProductImageUrl(selectedProduct.product.imageUrl)} 
                    alt={selectedProduct.product.name} 
                    className="h-48 object-contain drop-shadow-sm"
                  />
                ) : (
                  <div className="h-48 w-48 bg-slate-100 rounded-full flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tên sản phẩm</label>
                  <p className="font-medium text-lg text-slate-900 leading-tight">{selectedProduct.product.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SKU</label>
                    <p className="font-mono bg-slate-100 px-2 py-1 rounded inline-block text-sm">{selectedProduct.product.sku}</p>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Barcode</label>
                    <p className="font-mono text-sm">{selectedProduct.product.barcode}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vị trí</label>
                    <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-blue-700 text-lg">{selectedProduct.location.code}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Số lượng</label>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-green-600 text-2xl">{selectedProduct.quantity}</span>
                        <span className="text-sm text-slate-500 font-medium">{selectedProduct.product.unit}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}