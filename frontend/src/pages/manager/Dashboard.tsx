import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TaskCard,
  QuickLink,
  TransitItem,
  ActivityRow,
  EmptyState,
  DashboardSkeleton,
} from "@/components/subComponent";

import {
  Package,
  Warehouse,
  TrendingUp,
  AlertTriangle,
  FileBarChart,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  MetricCard,
  SummaryItem,
  ProductRow,
  QuickButton,
} from "@/components/subComponent";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useDashboard();

  if (isLoading) return <div>Loading...</div>;

  const { stats, recentActivities, topProducts } = data!;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Tổng quan quản lý"
        description="Giám sát hoạt động kho hàng"
      />

      {/* KEY METRICS */}
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard
          title="Tổng sản phẩm"
          value={stats.totalProducts}
          icon={Package}
          onClick={() => navigate("/manager/inventoryPage")}
        />
        <MetricCard
          title="Kệ trống"
          value={stats.availableShelves}
          icon={Warehouse}
          variant="success"
        />
        <MetricCard
          title="Cảnh báo tồn"
          value={stats.lowStockCount}
          icon={AlertTriangle}
          variant="warning"
        />
        <MetricCard
          title="Hiệu suất"
          value="94%"
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* TODAY'S SUMMARY */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hoạt động hôm nay</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryItem
              label="Đơn nhập"
              value={stats.todayInbound}
              icon={CheckCircle2}
              color="text-blue-600"
            />
            <SummaryItem
              label="Đơn xuất"
              value={stats.todayOutbound}
              icon={CheckCircle2}
              color="text-purple-600"
            />
            <SummaryItem
              label="Chờ xử lý"
              value={stats.pendingPutAway}
              icon={Clock}
              color="text-amber-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* MAIN GRID */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities?.map((act: any) => (
              <ActivityRow key={act.id} activity={act} />
            ))}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              {topProducts?.map((p: any, i: number) => (
                <ProductRow key={p.sku} product={p} rank={i + 1} />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickButton
                label="Báo cáo"
                icon={FileBarChart}
                onClick={() => navigate("/manager/reports")}
              />
              <QuickButton
                label="Đơn nhập hàng"
                onClick={() => navigate("/manager/purchase-order")}
              />
              <QuickButton
                label="Kiểm kê"
                onClick={() => navigate("/manager/stocktake")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
