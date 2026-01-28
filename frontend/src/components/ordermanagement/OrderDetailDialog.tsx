import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { OutboundOrder } from "@/types/outboundordermanagement";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { orderManagementService } from "@/services/ordermanagement.service";
import { Package, User, Phone, MapPin, Calendar } from "lucide-react";

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OutboundOrder | null;
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  order,
}: OrderDetailDialogProps) {
  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ FIXED: Thêm max-h và flex layout */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            Chi tiết đơn hàng
            <span className="font-mono text-primary">{order.orderNumber}</span>
          </DialogTitle>
        </DialogHeader>

        {/* ✅ FIXED: Thêm overflow-y-auto */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {/* Thông tin chung */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Trạng thái</p>
                <div className="mt-1">
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Ngày tạo</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="font-medium">
                    {orderManagementService.formatDate(order.createdDate)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Khách hàng</p>
                <p className="font-medium mt-1">{order.customerName}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Người tạo</p>
                <p className="font-medium mt-1">{order.createdByName}</p>
              </div>

              {order.assignedPickerName && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">
                    Nhân viên lấy hàng
                  </p>
                  <p className="font-medium mt-1">{order.assignedPickerName}</p>
                </div>
              )}
            </div>

            {/* Thông tin giao hàng */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Thông tin giao hàng</h3>
              <div className="space-y-2 p-4 border rounded-lg">
                <div className="flex items-start gap-2">
                  <User className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Người nhận</p>
                    <p className="font-medium">{order.toName}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Số điện thoại
                    </p>
                    <p className="font-medium">{order.toPhone}</p>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Địa chỉ</p>
                    <p className="font-medium">{order.toAddress}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danh sách sản phẩm */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                <h3 className="font-semibold text-lg">
                  Danh sách sản phẩm ({order.details.length} items)
                </h3>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>STT</TableHead>
                      <TableHead>Tên sản phẩm</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-center">Yêu cầu</TableHead>
                      <TableHead className="text-center">Đã phân bổ</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.details.map((detail, index) => (
                      <TableRow key={detail.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          {detail.productName}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {detail.productSku}
                        </TableCell>
                        <TableCell className="text-center">
                          {detail.requestedQty}
                        </TableCell>
                        <TableCell className="text-center">
                          {detail.allocatedQty}
                        </TableCell>
                        <TableCell className="text-center">
                          {detail.allocatedQty === detail.requestedQty ? (
                            <Badge variant="default">Đủ</Badge>
                          ) : detail.allocatedQty > 0 ? (
                            <Badge variant="secondary">Thiếu</Badge>
                          ) : (
                            <Badge variant="outline">Chưa phân bổ</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Tổng kết */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Tổng items</p>
                  <p className="text-2xl font-bold text-primary">
                    {order.details.reduce((sum, d) => sum + d.requestedQty, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Đã phân bổ</p>
                  <p className="text-2xl font-bold text-green-600">
                    {order.details.reduce(
                      (sum, d) => sum + d.allocatedQty,
                      0,
                    ) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Còn thiếu</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {order.details.reduce(
                      (sum, d) => sum + (d.requestedQty - d.allocatedQty),
                      0,
                    ) || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
