import { useDashboard } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  PackagePlus,
  PackageMinus,
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  TaskCard,
  QuickLink,
  TransitItem,
  ActivityRow,
  EmptyState,
  DashboardSkeleton,
} from "@/components/subComponent";

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { data, isLoading, refetch, isRefetching } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  const { stats, recentActivities, transitItems } = data!;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Nhiệm vụ của tôi"
          description="Công việc cần thực hiện hôm nay"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${isRefetching ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      {/* ⚠️ PRIORITY ALERTS */}
      {stats.pendingPutAway > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">
                Bạn có {stats.pendingPutAway} sản phẩm đang chờ cất hàng
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
              onClick={() => navigate("/staff/put-away")}
            >
              Cất hàng ngay
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 📊 MY TASKS - Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <TaskCard
          title="Hàng chờ cất"
          value={stats.pendingPutAway}
          icon={Clock}
          variant="warning"
          action="Cất hàng"
          onClick={() => navigate("/staff/put-away")}
        />
        <TaskCard
          title="Phiếu nhập hôm nay"
          value={stats.todayInbound}
          icon={PackagePlus}
          variant="success"
          action="Xem phiếu"
          onClick={() => navigate("/staff/inboundNote")}
        />
        <TaskCard
          title="Đơn xuất hôm nay"
          value={stats.todayOutbound}
          icon={PackageMinus}
          variant="info"
          action="Xem đơn"
          onClick={() => navigate("/staff/outbound")}
        />
      </div>

      {/* MAIN CONTENT */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* RECENT ACTIVITIES */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivities?.length === 0 ? (
              <EmptyState message="Chưa có hoạt động nào" />
            ) : (
              <div className="space-y-3">
                {recentActivities?.slice(0, 8).map((activity: any) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* QUICK LINKS */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Truy cập nhanh</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <QuickLink
                label="Nhập kho"
                icon={Package}
                onClick={() => navigate("/staff/picking")}
              />
              <QuickLink
                label="Cất hàng"
                icon={PackagePlus}
                badge={stats.pendingPutAway}
                onClick={() => navigate("/staff/put-away")}
              />
              <QuickLink
                label="Xuất kho"
                icon={PackageMinus}
                onClick={() => navigate("/staff/outbound")}
              />
              <QuickLink
                label="Tồn kho"
                icon={Package}
                onClick={() => navigate("/staff/inventory")}
              />
            </CardContent>
          </Card>

          {/* TRANSIT ITEMS */}
          {transitItems?.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Hàng của tôi</CardTitle>
                  <Badge>{transitItems.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {transitItems.slice(0, 5).map((item: any) => (
                    <TransitItem key={item.productId} item={item} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
