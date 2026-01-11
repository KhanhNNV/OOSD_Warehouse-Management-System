import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { outboundService } from "@/services/outbound.service";
import { OutboundOrder } from "@/types/outbound";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Package, MapPin, Phone, User } from "lucide-react";
import { OutboundStatusBadge } from "@/components/outbound/OutboundStatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function OutboundDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<OutboundOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchOrder = async () => {
      try {
        const data = await outboundService.getOrderById(parseInt(id));
        setOrder(data);
      } catch (error) {
        console.error("Lỗi tải đơn hàng:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  if (!order) return <div className="p-8 text-center text-red-500">Không tìm thấy đơn hàng</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header & Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate("/staff/outbound")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chi tiết đơn hàng {order.orderNumber}</h1>
          <p className="text-muted-foreground">Xem thông tin chi tiết và danh sách sản phẩm</p>
        </div>
        <div className="ml-auto">
          <OutboundStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Thông tin người nhận */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Thông tin giao hàng
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Người nhận</p>
                <p className="font-medium">{order.toName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Số điện thoại</p>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <p className="font-medium">{order.toPhone}</p>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Địa chỉ</p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <p className="font-medium">{order.toAddress}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thông tin chung */}
        <Card>
          <CardHeader>
            <CardTitle>Tổng quan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Ngày tạo:</span>
              <span className="font-medium">{new Date(order.createdDate).toLocaleDateString("vi-VN")}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tổng số loại:</span>
              <span className="font-medium">{order.totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tổng số lượng:</span>
              <span className="font-bold text-blue-600">{order.totalQuantity}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách sản phẩm */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            Danh sách sản phẩm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sản phẩm</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Yêu cầu</TableHead>
                <TableHead className="text-right">Đã phân bổ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.details.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell>{item.productSku}</TableCell>
                  <TableCell className="text-right font-bold">{item.requestedQty}</TableCell>
                  <TableCell className="text-right text-green-600 font-bold">{item.allocatedQty}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}