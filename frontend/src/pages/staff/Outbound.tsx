// ============ IMPORT GỐC - GIỮ NGUYÊN ============
import { Plus, Search, Filter, Eye, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { SOStatusBadge } from "@/components/outbound/SOStatusBadge"; // Badge riêng
import { useOutbound } from "@/hooks/useOutbound";
import { cn } from "@/lib/utils";

// ============ MỚI THÊM ============
import { useState } from "react";
import { Truck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "@/hooks/useMasterData";
import { CreateOrderDialog } from "@/components/outbound/CreateOrderDialog";
// Chú ý: OutboundStatusBadge sẽ thay thế SOStatusBadge
import { OutboundStatusBadge } from "@/components/outbound/OutboundStatusBadge";
// ==================================

export default function OutboundPage() {
  // ============ CODE GỐC ============
  const { orders, stats, searchTerm, setSearchTerm } = useOutbound();

  // ============ MỚI THÊM ============
  const navigate = useNavigate();
  const { products } = useMasterData();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const handleViewPickingInstruction = (orderId: number) => {
    // Mở tab mới với chỉ dẫn lấy hàng
    window.open(`/staff/picking-instruction/${orderId}`, "_blank");
  };

  const refetch = () => {
    // Hook useOutbound sẽ tự động refetch khi component mount
    window.location.reload();
  };
  // ==================================

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Quản lý Xuất kho (Outbound)"
        description="Xử lý đơn hàng: Giữ chỗ (Allocated) -> Nhặt (Picking) -> Đóng gói (Packed)."
        action={
          // ============ CẬP NHẬT: Thêm onClick ============
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Tạo đơn xuất
          </Button>
        }
      />

      {/* Stats Cards - Hiển thị tổng quan quy trình */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: "Đơn mới (Cần duyệt)",
            count: stats.new,
            color: "text-slate-600",
            icon: Package, // MỚI THÊM
          },
          {
            label: "Đang xử lý trong kho",
            count: stats.processing,
            color: "text-blue-600",
            icon: Package, // MỚI THÊM
          },
          {
            label: "Đã giao đi",
            count: stats.shipped,
            color: "text-green-600",
            icon: Truck, // MỚI THÊM
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-lg border p-4 shadow-sm"
          >
            {/* ============ CẬP NHẬT: Thêm icon ============ */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className={cn("text-2xl font-bold mt-1", stat.color)}>
                  {stat.count}
                </p>
              </div>
              <stat.icon className={cn("w-8 h-8", stat.color)} />
            </div>
          </div>
        ))}
      </div>

      {/* ============ CODE GỐC - GIỮ NGUYÊN ============ */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm mã đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" /> Bộ lọc
        </Button>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Mã đơn</TableHead>
              <TableHead>Khách hàng</TableHead>
              {/* ============ MỚI THÊM CỘT ============ */}
              <TableHead>Địa chỉ</TableHead>
              {/* ====================================== */}
              <TableHead>Trạng thái</TableHead>
              <TableHead>Tiến độ xử lý</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              {/* ============ CẬP NHẬT: Đổi tên cột ============ */}
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* ============ CẬP NHẬT: Thêm empty state ============ */}
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>Chưa có đơn hàng nào</p>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => {
                // Tính % dựa trên số lượng đã phân bổ
                const totalAllocatedQty =
                  order.details?.reduce(
                    (sum, item) => sum + item.allocatedQty,
                    0
                  ) || 0;
                const percentByQuantity =
                  Math.round((totalAllocatedQty / order.totalQuantity) * 100) ||
                  0;

                const percent = percentByQuantity;
                // Tính % hoàn thành dựa trên số lượng đã phân bổ (Allocated)
                // const percent =
                //   Math.round((order.allocatedItems / order.totalItems) * 100) ||
                //   0;

                return (
                  <TableRow
                    key={order.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <TableCell className="font-medium">
                      {order.orderNumber}
                    </TableCell>

                    {/* ============ CẬP NHẬT: Hiển thị customerName hoặc toName ============ */}
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {order.customerName || order.toName}
                        </div>
                        {order.toPhone && (
                          <div className="text-xs text-muted-foreground">
                            {order.toPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* ============ MỚI THÊM CỘT ĐỊA CHỈ ============ */}
                    <TableCell className="max-w-[200px] truncate">
                      {order.toAddress}
                    </TableCell>
                    {/* ========================================== */}

                    <TableCell>
                      {/* ============ COMMENT CODE CŨ, DÙNG CODE MỚI ============ */}
                      {/* <SOStatusBadge status={order.status} /> */}
                      <OutboundStatusBadge status={order.status} />
                    </TableCell>

                    {/* ============ CODE GỐC - GIỮ NGUYÊN ============ */}
                    <TableCell>
                      <div className="flex items-center gap-3 max-w-[140px]">
                        <Progress value={percent} className="h-2" />
                        <span className="text-xs text-muted-foreground w-8">
                          {percent}%
                        </span>
                      </div>
                    </TableCell>

                    {/* ============ CẬP NHẬT: Hiển thị totalQuantity thay vì totalItems ============ */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold">
                          {order.totalQuantity || order.totalItems}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({order.totalItems} sp)
                        </span>
                      </div>
                    </TableCell>

                    {/* ============ CẬP NHẬT: Thêm nút Xuất ============ */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            navigate(`/staff/outbound/${order.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>

                        {/* Nút XUẤT - Mở tab mới với chỉ dẫn */}
                        {order.status === "NEW" && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={() =>
                              handleViewPickingInstruction(order.id)
                            }
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Xuất
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ============ MỚI THÊM: Create Order Dialog ============ */}
      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={refetch}
        products={products}
      />
    </div>
  );
}
