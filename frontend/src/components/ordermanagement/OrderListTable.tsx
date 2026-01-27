import { OutboundOrder } from "@/types/outboundordermanagement";
import { orderManagementService } from "@/services/ordermanagement.service";
import { Eye, CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "./OrderStatusBadge";

interface OrderListTableProps {
  orders: OutboundOrder[];
  isLoading: boolean;
  onViewDetail: (order: OutboundOrder) => void;
  onConfirm: (orderId: number) => void;
  onCancel: (orderId: number) => void;
}

export function OrderListTable({
  orders,
  isLoading,
  onViewDetail,
  onConfirm,
  onCancel,
}: OrderListTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Không tìm thấy đơn hàng nào
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã đơn</TableHead>
            <TableHead>Khách hàng</TableHead>
            <TableHead>Người nhận</TableHead>
            <TableHead>SĐT</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Số items</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Ngày hoàn thành</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono font-medium">
                {order.orderNumber}
              </TableCell>
              <TableCell>{order.customerName}</TableCell>
              <TableCell>{order.toName}</TableCell>
              <TableCell>{order.toPhone}</TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status} />
              </TableCell>
              <TableCell>{order.details.length}</TableCell>
              <TableCell>
                {orderManagementService.formatDate(order.createdDate)}
              </TableCell>
              <TableCell>
                {order.exportedDate ? orderManagementService.formatDate(order.exportedDate) : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onViewDetail(order)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  {order.status === "NEW" && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onConfirm(order.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Duyệt
                    </Button>
                  )}

                  {(order.status === "NEW" || order.status === "ALLOCATED") && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onCancel(order.id)}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Hủy
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
