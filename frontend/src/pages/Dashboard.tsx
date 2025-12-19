import {
  PackagePlus,
  Package,
  AlertTriangle,
  Activity,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ActivityLog } from "@/types/wms";

const mockActivities: ActivityLog[] = [
  {
    id: "1",
    type: "inbound",
    action: "Xác nhận nhận hàng",
    description: "Nhân viên A đã xác nhận nhận hàng PO #PO-2024-001 từ Samsung",
    user: "Nhân viên A",
    timestamp: "2024-10-14T14:30:00Z",
  },
  {
    id: "2",
    type: "stocktake",
    action: "Phát hiện chênh lệch",
    description: "Phiên kiểm kê Zone A phát hiện 5 sản phẩm chênh lệch",
    user: "Hệ thống",
    timestamp: "2024-10-14T13:45:00Z",
  },
  {
    id: "3",
    type: "outbound",
    action: "Hoàn thành xuất kho",
    description: "Đơn hàng SO-2024-089 đã xuất kho thành công",
    user: "Nhân viên B",
    timestamp: "2024-10-14T12:20:00Z",
  },
  {
    id: "4",
    type: "adjustment",
    action: "Điều chỉnh tồn kho",
    description: "Duyệt điều chỉnh +3 iPhone 15 Pro Max theo kết quả kiểm kê",
    user: "Nguyễn Văn A",
    timestamp: "2024-10-14T11:00:00Z",
  },
  {
    id: "5",
    type: "inbound",
    action: "Tạo PO mới",
    description: "Tạo đơn nhập hàng PO-2024-005 từ Apple Vietnam",
    user: "Nguyễn Văn A",
    timestamp: "2024-10-14T09:30:00Z",
  },
];

const typeColors: Record<string, string> = {
  inbound: "bg-success/10 text-success",
  outbound: "bg-info/10 text-info",
  stocktake: "bg-warning/10 text-warning",
  adjustment: "bg-primary/10 text-primary",
};

const typeLabels: Record<string, string> = {
  inbound: "Nhập kho",
  outbound: "Xuất kho",
  stocktake: "Kiểm kê",
  adjustment: "Điều chỉnh",
};

export default function Dashboard() {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tổng quan"
        description="Theo dõi hoạt động kho hàng trong ngày"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Đơn nhập chờ xử lý"
          value={12}
          icon={PackagePlus}
          variant="warning"
          trend={{ value: 15, isPositive: false }}
        />
        <StatCard
          title="Hàng chờ lên kệ"
          value={45}
          icon={Package}
          variant="info"
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Cảnh báo kiểm kê"
          value={8}
          icon={AlertTriangle}
          variant="warning"
        />
        <StatCard
          title="Hoạt động hôm nay"
          value={127}
          icon={Activity}
          variant="success"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Log */}
        <div className="lg:col-span-2 bg-card rounded-xl border">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">Hoạt động gần đây</h2>
          </div>
          <div className="divide-y">
            {mockActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-start gap-4">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${typeColors[activity.type]}`}
                  >
                    {typeLabels[activity.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.action}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 truncate">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(activity.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          {/* Inbound Summary */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Nhập kho tuần này</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng đơn</span>
                <span className="font-semibold">28</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Hoàn thành</span>
                <span className="font-semibold text-success">23</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Có chênh lệch</span>
                <span className="font-semibold text-warning">3</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "82%" }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">82% hoàn thành</p>
            </div>
          </div>

          {/* Outbound Summary */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Xuất kho tuần này</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tổng đơn</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đã giao</span>
                <span className="font-semibold text-success">142</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Đang xử lý</span>
                <span className="font-semibold text-info">14</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success rounded-full" style={{ width: "91%" }} />
              </div>
              <p className="text-xs text-muted-foreground text-center">91% hoàn thành</p>
            </div>
          </div>

          {/* Top Moving Products */}
          <div className="bg-card rounded-xl border p-6">
            <h3 className="font-semibold mb-4">Sản phẩm xuất nhiều nhất</h3>
            <div className="space-y-3">
              {[
                { name: "iPhone 15 Pro Max", qty: 89, trend: "up" },
                { name: "Samsung S24 Ultra", qty: 67, trend: "up" },
                { name: "MacBook Pro 14", qty: 45, trend: "down" },
              ].map((product, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{product.name}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{product.qty}</span>
                    {product.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
