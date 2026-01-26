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
import { Loader2, Box, ArrowLeft, Layers, MapPin, Package } from "lucide-react";
import { inventoryManagerService } from "@/services/inventoryManager.service";
import { InventoryDetail, ShelfStat } from "@/types/inventoryManager";
import { ZoneResponse } from "@/types/wms";
import { getProductImageUrl } from "@/services/inventoryManager.service";

// Hàm helper xác định màu dựa trên số lượng
const getShelfColor = (qty: number) => {
  if (qty === 0) return "bg-slate-100 text-slate-400 border-slate-200"; // Rỗng
  if (qty <= 10)
    return "bg-red-100 text-red-700 border-red-200 hover:bg-red-200";
  if (qty <= 20)
    return "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200";
  return "bg-green-100 text-green-700 border-green-200 hover:bg-green-200";
};

export default function InventoryPage() {
  // --- STATE ---
  const [view, setView] = useState<"ZONES" | "SHELVES" | "BINS">("ZONES");
  const [loading, setLoading] = useState(false);

  const [zones, setZones] = useState<ZoneResponse[]>([]);
  const [currentZone, setCurrentZone] = useState<string>("");

  const [shelves, setShelves] = useState<ShelfStat[]>([]);
  const [currentShelf, setCurrentShelf] = useState<string>("");

  const [binInventory, setBinInventory] = useState<InventoryDetail[]>([]);
  const [selectedProduct, setSelectedProduct] =
    useState<InventoryDetail | null>(null);

  // --- EFFECT: Load Zones ban đầu ---
  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    setLoading(true);
    try {
      const data = await inventoryManagerService.getZones();
      setZones(data);
    } catch (error) {
      console.error("Lỗi load zones", error);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleSelectZone = async (zoneCode: string) => {
    setCurrentZone(zoneCode);
    setLoading(true);
    try {
      // Gọi API lấy thống kê số lượng để tô màu
      const statsMap = await inventoryManagerService.getShelfStats(zoneCode);

      // Map object { "01": 5, "02": 25 } thành mảng ShelfStat
      const shelvesData: ShelfStat[] = Object.entries(statsMap)
        .map(([code, qty]) => ({
          code,
          quantity: qty,
          color: "gray" as const, // Sẽ được xử lý bởi getShelfColor ở UI
        }))
        .sort((a, b) => a.code.localeCompare(b.code));

      setShelves(shelvesData);
      setView("SHELVES");
    } catch (error) {
      console.error("Lỗi load shelves", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectShelf = async (shelfCode: string) => {
    setCurrentShelf(shelfCode);
    setLoading(true);
    try {
      const data = await inventoryManagerService.getShelfInventory(
        currentZone,
        shelfCode,
      );
      setBinInventory(data);
      setView("BINS");
    } catch (error) {
      console.error("Lỗi load inventory", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (view === "BINS") setView("SHELVES");
    else if (view === "SHELVES") setView("ZONES");
  };

  // --- RENDERERS ---

  // 1. Giao diện Danh sách Khu vực (Zone)
  const renderZones = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {zones.map((z) => (
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
  );

  // 2. Giao diện Danh sách Kệ (Shelves) - CÓ MÀU SẮC
  const renderShelves = () => (
    <div>
      <div className="flex gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500"></span> &le; 10 SP
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span> 10-20 SP
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span> &gt; 20 SP
        </div>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {shelves.map((s) => (
          <div
            key={s.code}
            onClick={() => handleSelectShelf(s.code)}
            className={`
              cursor-pointer rounded-xl border-2 p-4 flex flex-col items-center justify-center transition-all h-28
              ${getShelfColor(s.quantity)}
            `}
          >
            <Layers className="w-6 h-6 mb-2 opacity-80" />
            <span className="font-bold text-xl">{s.code}</span>
            <span className="text-xs font-semibold mt-1">SL: {s.quantity}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // 3. Giao diện Chi tiết Ô (Bins) & Sản phẩm
  const renderBins = () => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Danh sách sản phẩm trong Kệ {currentShelf} (Khu {currentZone})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!binInventory || binInventory.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            Không có sản phẩm nào trên kệ này
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vị trí (Ô)</TableHead>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tên sản phẩm</TableHead>
                <TableHead>Mã SP</TableHead>
                <TableHead className="text-right">Tồn kho</TableHead>
                <TableHead>Hạn sử dụng</TableHead>
                <TableHead>Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {binInventory?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-bold font-mono text-blue-600">
                    {item.location.code}
                  </TableCell>
                  <TableCell>
                    {item.product.imageUrl ? (
                      <img
                        src={getProductImageUrl(item.product.imageUrl)}
                        alt="Product"
                        className="w-10 h-10 object-contain rounded border bg-white"
                        onError={(e) => {
                          // Fallback nếu link Google bị chết
                          (e.target as HTMLImageElement).src =
                            "https://placehold.co/40x40?text=Error";
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center">
                        <Package className="w-5 h-5 text-slate-300" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {item.product.name}
                  </TableCell>
                  <TableCell>{item.product.sku}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="outline" className="text-base">
                      {item.quantity} {item.product.unit}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.expiryDate || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProduct(item)}
                    >
                      Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Header & Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {view !== "ZONES" && (
            <Button variant="ghost" size="icon" onClick={handleBack}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
          )}

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            Quản lý Tồn kho
            {view !== "ZONES" && (
              <span className="text-slate-400">/ Khu {currentZone}</span>
            )}
            {view === "BINS" && (
              <span className="text-slate-400">/ Kệ {currentShelf}</span>
            )}
          </h1>
        </div>
        {loading && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
      </div>

      {/* Main Content Area */}
      <div className="min-h-[500px]">
        {view === "ZONES" && renderZones()}
        {view === "SHELVES" && renderShelves()}
        {view === "BINS" && renderBins()}
      </div>

      {/* Modal Chi tiết Sản phẩm */}
      <Dialog
        open={!!selectedProduct}
        onOpenChange={() => setSelectedProduct(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chi tiết sản phẩm</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="grid gap-4 py-4">
              <div className="flex justify-center mb-4">
                {selectedProduct.product.imageUrl ? (
                  <img
                    src={selectedProduct.product.imageUrl}
                    alt={selectedProduct.product.name}
                    className="w-48 h-48 object-contain rounded-lg border shadow-sm"
                  />
                ) : (
                  <div className="w-48 h-48 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-slate-300" />
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase">
                    Tên sản phẩm
                  </label>
                  <p className="font-medium text-lg">
                    {selectedProduct.product.name}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      SKU
                    </label>
                    <p className="font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                      {selectedProduct.product.sku}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Barcode
                    </label>
                    <p className="font-mono">
                      {selectedProduct.product.barcode}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Vị trí
                    </label>
                    <p className="font-bold text-blue-600">
                      {selectedProduct.location.code}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">
                      Số lượng
                    </label>
                    <p className="font-bold text-green-600 text-xl">
                      {selectedProduct.quantity} {selectedProduct.product.unit}
                    </p>
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
