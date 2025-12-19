import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, RefreshCw, Check, AlertTriangle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { StocktakeItem } from "@/types/wms";
import { StocktakeVarianceTable } from "@/components/stocktake/StocktakeVarianceTable";
import { toast } from "@/hooks/use-toast";

// Mock data for stocktake items
const mockItems: StocktakeItem[] = [
  {
    id: "1",
    sessionId: "1",
    productId: "P001",
    productName: "Laptop Dell XPS 15",
    sku: "DELL-XPS15-001",
    location: "A-01-01",
    systemQty: 25,
    actualQty: 25,
    variance: 0,
    status: "counted",
    countedBy: "Nhân viên A",
    countedAt: "2024-10-14T10:30:00Z",
  },
  {
    id: "2",
    sessionId: "1",
    productId: "P002",
    productName: "iPhone 15 Pro Max 256GB",
    sku: "APL-IP15PM-256",
    location: "A-01-02",
    systemQty: 50,
    actualQty: 48,
    variance: -2,
    status: "counted",
    countedBy: "Nhân viên B",
    countedAt: "2024-10-14T11:00:00Z",
  },
  {
    id: "3",
    sessionId: "1",
    productId: "P003",
    productName: "Samsung Galaxy S24 Ultra",
    sku: "SAM-S24U-001",
    location: "A-02-01",
    systemQty: 30,
    actualQty: 33,
    variance: 3,
    status: "counted",
    countedBy: "Nhân viên A",
    countedAt: "2024-10-14T11:30:00Z",
  },
  {
    id: "4",
    sessionId: "1",
    productId: "P004",
    productName: "MacBook Pro 14 M3",
    sku: "APL-MBP14M3-001",
    location: "A-02-02",
    systemQty: 15,
    actualQty: null,
    variance: null,
    status: "pending",
  },
  {
    id: "5",
    sessionId: "1",
    productId: "P005",
    productName: "AirPods Pro 2",
    sku: "APL-APP2-001",
    location: "A-03-01",
    systemQty: 100,
    actualQty: 95,
    variance: -5,
    status: "recount",
    countedBy: "Nhân viên C",
    countedAt: "2024-10-14T12:00:00Z",
    notes: "Yêu cầu đếm lại do chênh lệch lớn",
  },
  {
    id: "6",
    sessionId: "1",
    productId: "P006",
    productName: "iPad Pro 12.9 M2",
    sku: "APL-IPADP-M2",
    location: "A-03-02",
    systemQty: 20,
    actualQty: 18,
    variance: -2,
    status: "approved",
    countedBy: "Nhân viên B",
    countedAt: "2024-10-14T12:30:00Z",
  },
];

export default function StocktakeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState<StocktakeItem[]>(mockItems);

  const sessionInfo = {
    name: "Kiểm kê tuần 42 - Zone A",
    status: "open" as const,
    totalItems: items.length,
    countedItems: items.filter((i) => i.status !== "pending").length,
    varianceCount: items.filter((i) => i.variance !== null && i.variance !== 0).length,
  };

  const handleRecount = (itemId: string) => {
    setItems(items.map((item) =>
      item.id === itemId ? { ...item, status: "recount" as const, notes: "Yêu cầu đếm lại" } : item
    ));
    toast({
      title: "Đã yêu cầu đếm lại",
      description: "Nhân viên sẽ được thông báo để đếm lại sản phẩm này.",
    });
  };

  const handleApprove = (itemId: string) => {
    setItems(items.map((item) =>
      item.id === itemId ? { ...item, status: "approved" as const } : item
    ));
    toast({
      title: "Đã duyệt điều chỉnh",
      description: "Số lượng tồn kho sẽ được cập nhật theo kết quả kiểm kê.",
    });
  };

  const handleBulkApprove = () => {
    setItems(items.map((item) =>
      item.variance !== null && item.variance !== 0 && item.status === "counted"
        ? { ...item, status: "approved" as const }
        : item
    ));
    toast({
      title: "Đã duyệt tất cả chênh lệch",
      description: "Số lượng tồn kho sẽ được cập nhật theo kết quả kiểm kê.",
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => navigate("/stocktake")}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Quay lại danh sách
      </Button>

      <PageHeader
        title={sessionInfo.name}
        description={`Phiên kiểm kê #${id}`}
        action={
          <div className="flex items-center gap-3">
            <StatusBadge status={sessionInfo.status} />
            <Button variant="outline" onClick={handleBulkApprove}>
              <Check className="w-4 h-4 mr-2" />
              Duyệt tất cả chênh lệch
            </Button>
          </div>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng sản phẩm</p>
              <p className="text-2xl font-semibold">{sessionInfo.totalItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Check className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã kiểm</p>
              <p className="text-2xl font-semibold">{sessionInfo.countedItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <AlertTriangle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Chênh lệch</p>
              <p className="text-2xl font-semibold">{sessionInfo.varianceCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <RefreshCw className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tiến độ</p>
              <p className="text-2xl font-semibold">
                {Math.round((sessionInfo.countedItems / sessionInfo.totalItems) * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Variance Table */}
      <StocktakeVarianceTable
        items={items}
        onRecount={handleRecount}
        onApprove={handleApprove}
      />
    </div>
  );
}
