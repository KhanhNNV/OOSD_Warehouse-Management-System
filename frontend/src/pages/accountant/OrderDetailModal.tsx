// src/components/accountant/OrderDetailModal.tsx

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Package } from "lucide-react"; // Icon loading & kiện hàng
import { outboundService } from "../../services/outbound.service";
import { OutboundOrderResponse } from "../../types/outbound";

interface Props {
    orderId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onCreateInvoice: (order: OutboundOrderResponse) => void;
}

export function OrderDetailModal({ orderId, isOpen, onClose, onCreateInvoice }: Props) {
    const [order, setOrder] = useState<OutboundOrderResponse | null>(null);
    const [loading, setLoading] = useState(false);

    // Khi mở modal thì load dữ liệu mới nhất từ API
    useEffect(() => {
        if (isOpen && orderId) {
            fetchDetail();
        } else {
            setOrder(null);
        }
    }, [isOpen, orderId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            // Gọi API lấy chi tiết đơn hàng
            // Lưu ý: outboundService.getOrderById của bạn trả về Promise<any>
            // Bạn cần ép kiểu hoặc sửa service trả về OutboundOrderResponse
            const data = await outboundService.getOrderById(orderId!);
            setOrder(data as unknown as OutboundOrderResponse);
        } catch (error) {
            console.error("Lỗi tải chi tiết đơn hàng:", error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return "---";
        return new Date(dateString).toLocaleDateString("vi-VN");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Chi tiết đơn hàng: <span className="text-blue-600">{order?.orderNumber}</span>
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : order ? (
                    <div className="space-y-6">
                        {/* 1. THÔNG TIN CHUNG */}
                        <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                            <div>
                                <p className="text-gray-500">Khách hàng:</p>
                                <p className="font-medium">{order.customerName}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Người nhận:</p>
                                <p className="font-medium">{order.toName} - {order.toPhone}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Địa chỉ giao:</p>
                                <p className="font-medium">{order.toAddress}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Ngày tạo:</p>
                                <p className="font-medium">{formatDate(order.createdDate)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Trạng thái:</p>
                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                    {order.status}
                                </Badge>
                            </div>
                        </div>

                        {/* 2. BẢNG CHI TIẾT HÀNG HÓA */}
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-100">
                                        <TableHead>Mã SKU</TableHead>
                                        <TableHead>Tên sản phẩm</TableHead>
                                        <TableHead className="text-center">SL Yêu cầu</TableHead>
                                        <TableHead className="text-center text-green-700 font-bold">SL Thực xuất</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.details?.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-mono text-xs">{item.productSku}</TableCell>
                                            <TableCell>{item.productName}</TableCell>
                                            <TableCell className="text-center text-gray-500">
                                                {item.requestedQty}
                                            </TableCell>
                                            <TableCell className="text-center font-bold text-green-600">
                                                {item.allocatedQty}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {/* Dòng tổng cộng */}
                                    <TableRow className="bg-gray-50 font-bold">
                                        <TableCell colSpan={2} className="text-right">Tổng cộng:</TableCell>
                                        <TableCell className="text-center">{order.details?.reduce((sum, i) => sum + i.requestedQty, 0)}</TableCell>
                                        <TableCell className="text-center text-green-700">{order.totalQuantity}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>

                        {/* 3. BUTTON ACTIONS */}
                        <div className="flex justify-end gap-3 pt-2">
                            <Button variant="outline" onClick={onClose}>Đóng</Button>
                            <Button
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => onCreateInvoice(order)}
                            >
                                Xác nhận & Tạo Hóa Đơn
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-red-500">Không tìm thấy thông tin đơn hàng</p>
                )}
            </DialogContent>
        </Dialog>
    );
}