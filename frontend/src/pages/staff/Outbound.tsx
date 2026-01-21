// ============ IMPORT GỐC - GIỮ NGUYÊN ============
import { Plus, Search, Filter, Eye, Package, User, CircleUser } from "lucide-react";
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
import { RegisterOrderButton } from "@/components/outbound/picking/RegisterOrderButton";
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
              <TableHead>Người phụ trách</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              {/* ============ CẬP NHẬT: Đổi tên cột ============ */}
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>


<TableBody>
  {orders.length === 0 ? (
    <TableRow>
      <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
        <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>Chưa có đơn hàng nào</p>
      </TableCell>
    </TableRow>
  ) : (
    orders.map((order) => {
      // Logic màu sắc cho Avatar
      // Nếu là đơn của mình (isAssignedToCurrentUser = true) -> Màu xanh đậm
      // Nếu đơn của người khác -> Màu xám nhạt
      const isMine = order.isAssignedToCurrentUser;
      return (
        <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
          
          {/* 1. Mã đơn */}
          <TableCell className="font-medium">{order.orderNumber}</TableCell>

          {/* 2. Khách hàng */}
          <TableCell>
            <div>
              <div className="font-medium">{order.customerName || order.toName}</div>
              {order.toPhone && (
                <div className="text-xs text-muted-foreground">{order.toPhone}</div>
              )}
            </div>
          </TableCell>

          {/* 3. Địa chỉ */}
          <TableCell className="max-w-[200px] truncate">
            {order.toAddress}
          </TableCell>

          {/* 4. Trạng thái */}
          <TableCell>
            <OutboundStatusBadge status={order.status} />
          </TableCell>

          {/* ================================================================= */}
          {/* 5. NGƯỜI PHỤ TRÁCH (HIỂN THỊ LOGIC SỞ HỮU) */}
          {/* ================================================================= */}
          <TableCell>
            {order.assignedPickerName ? (
              <div className="flex items-center gap-2">

                {/* Tên & Chức danh */}
                <div className="flex flex-col">
                  <span className={cn("text-sm font-medium", isMine ? "text-blue-700" : "text-slate-700")}>
                    {isMine ? "Bạn đó ❤️" : order.assignedPickerName}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-sm text-slate-400 italic pl-2">--Chưa có ai--</span>
            )}
          </TableCell>

          {/* 6. Số lượng */}
          <TableCell className="text-right">
            <div className="flex items-center justify-end gap-1">
              <Package className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{order.totalQuantity || 0}</span>
              <span className="text-xs text-muted-foreground">
                ({order.totalItems} loại)
              </span>
            </div>
          </TableCell>

          {/* ================================================================= */}
          {/* 7. THAO TÁC (QUYẾT ĐỊNH CHO PHÉP LÀM GÌ) */}
          {/* ================================================================= */}
          <TableCell>
            <div className="flex items-center justify-center gap-2">
              
              {/* CASE A: Đơn chưa ai nhận (NEW/ALLOCATED) -> Hiện nút "Nhận đơn" */}
              {/* Điều kiện: Trạng thái cho phép VÀ Chưa có pickerName */}
              {(order.status === "NEW" || order.status === "ALLOCATED") && !order.assignedPickerName && (
                <RegisterOrderButton
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  onSuccess={
                          ()=> navigate(`/staff/outbound/${order.id}/details`)}
                />
              )}

              {/* CASE B: Đang soạn hàng (PICKING) */}
              {order.status === "PICKING" && (
                isMine ? (
                  // B.1: Đơn CỦA TÔI -> Nút "Tiếp tục soạn" (Active)
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                    onClick={() => navigate(`/staff/outbound/${order.id}/details`)}
                  >
                    <Eye className="w-4 h-4" />
                    Tiếp tục soạn
                  </Button>
                ) : (
                  // B.2: Đơn NGƯỜI KHÁC -> Nút Disabled
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    disabled 
                    className="bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Đang xử lý...
                  </Button>
                )
              )}

              {/* CASE C: Đã đóng gói hoặc Xuất xong -> Chỉ xem chi tiết */}
              {(order.status === "PACKED" || order.status === "SHIPPED" || order.status === "CANCELLED") && (
                <Button
                  variant="outline"
                  size="sm"
                
                >
                  Xong rổi
                </Button>
              )}

              {/* CASE D: Nút xem hướng dẫn (Option cũ, có thể giữ hoặc bỏ) */}
              {order.status && (
                 <Button
                   size="sm"
                   variant="ghost"
                   className="text-muted-foreground hover:text-foreground"
                   onClick={() => handleViewPickingInstruction(order.id)}
                 >
                   <Truck className="w-4 h-4" />
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
