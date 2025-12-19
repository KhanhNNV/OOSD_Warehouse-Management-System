import { useState } from "react";
import { Plus, Search, Filter, Eye, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { SalesOrder } from "@/types/wms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const mockSalesOrders: SalesOrder[] = [
  {
    id: "1",
    orderNumber: "SO-2024-001",
    customerName: "Công ty ABC",
    status: "pending",
    createdAt: "2024-10-14T08:00:00Z",
    totalItems: 25,
    allocatedItems: 0,
  },
  {
    id: "2",
    orderNumber: "SO-2024-002",
    customerName: "Shop XYZ",
    status: "allocated",
    createdAt: "2024-10-14T09:00:00Z",
    totalItems: 15,
    allocatedItems: 15,
  },
  {
    id: "3",
    orderNumber: "SO-2024-003",
    customerName: "Cửa hàng 123",
    status: "picking",
    createdAt: "2024-10-14T10:00:00Z",
    totalItems: 8,
    allocatedItems: 8,
  },
  {
    id: "4",
    orderNumber: "SO-2024-004",
    customerName: "Đại lý Miền Nam",
    status: "packed",
    createdAt: "2024-10-13T14:00:00Z",
    totalItems: 50,
    allocatedItems: 50,
  },
  {
    id: "5",
    orderNumber: "SO-2024-005",
    customerName: "FPT Shop",
    status: "shipped",
    createdAt: "2024-10-13T11:00:00Z",
    totalItems: 30,
    allocatedItems: 30,
  },
  {
    id: "6",
    orderNumber: "SO-2024-006",
    customerName: "Thế Giới Di Động",
    status: "completed",
    createdAt: "2024-10-12T09:00:00Z",
    totalItems: 100,
    allocatedItems: 100,
  },
];

const statusMap: Record<SalesOrder["status"], StatusType> = {
  pending: "pending",
  allocated: "processing",
  picking: "processing",
  packed: "processing",
  shipped: "processing",
  completed: "completed",
};

const statusLabels: Record<SalesOrder["status"], string> = {
  pending: "Chờ phân bổ",
  allocated: "Đã phân bổ",
  picking: "Đang lấy hàng",
  packed: "Đã đóng gói",
  shipped: "Đã gửi",
  completed: "Hoàn thành",
};

export default function OutboundPage() {
  const [salesOrders] = useState<SalesOrder[]>(mockSalesOrders);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = salesOrders.filter(
    (order) =>
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgress = (order: SalesOrder) => {
    return Math.round((order.allocatedItems / order.totalItems) * 100);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Xuất kho"
        description="Theo dõi và xử lý các đơn hàng xuất kho"
        action={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn xuất
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Chờ phân bổ", count: salesOrders.filter((o) => o.status === "pending").length, color: "text-warning" },
          { label: "Đang xử lý", count: salesOrders.filter((o) => ["allocated", "picking", "packed"].includes(o.status)).length, color: "text-info" },
          { label: "Đã gửi", count: salesOrders.filter((o) => o.status === "shipped").length, color: "text-primary" },
          { label: "Hoàn thành", count: salesOrders.filter((o) => o.status === "completed").length, color: "text-success" },
        ].map((stat) => (
          <div key={stat.label} className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{stat.label}</p>
            <p className={cn("text-2xl font-semibold mt-1", stat.color)}>{stat.count}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã đơn, khách hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Orders Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Mã đơn</TableHead>
              <TableHead className="font-semibold">Khách hàng</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="font-semibold">Phân bổ</TableHead>
              <TableHead className="font-semibold text-right">Số lượng</TableHead>
              <TableHead className="font-semibold">Ngày tạo</TableHead>
              <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-table-row-hover transition-colors">
                <TableCell className="font-medium">{order.orderNumber}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                  <StatusBadge status={statusMap[order.status]} />
                  <span className="ml-2 text-xs text-muted-foreground">
                    {statusLabels[order.status]}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 min-w-[100px]">
                    <Progress value={getProgress(order)} className="h-2" />
                    <span className="text-sm text-muted-foreground">
                      {getProgress(order)}%
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{order.totalItems}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(order.createdAt)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
