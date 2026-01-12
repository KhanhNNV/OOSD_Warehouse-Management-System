import { useRef } from "react"; // 1. Thêm useRef
import { useReactToPrint } from "react-to-print"; // 2. Thêm hook in ấn
import { Printer } from "lucide-react"; // 3. Thêm icon máy in

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
import { Button } from "@/components/ui/button";
import { Invoice, InvoiceDetail } from "@/types/invoice";
import { InvoicePrintTemplate } from './InvoicePrintTemplate'; // Component mẫu in

interface Props {
    invoice: Invoice | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatCurrency = (value: number | undefined) => {
    if (!value) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
};

const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleString("vi-VN");
};

export function InvoiceDetailModal({ invoice, isOpen, onClose }: Props) {
    // --- 4. CẤU HÌNH IN ẤN ---
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useReactToPrint({
        contentRef: printRef, // Phiên bản mới dùng contentRef
        documentTitle: invoice ? `Hoa_don_${invoice.invoiceNumber}` : "Hoa_don",
    });

    if (!invoice) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader className="border-b pb-4 mb-4">
                    <DialogTitle className="flex justify-between items-center">
                        <span>Chi Tiết Hóa Đơn</span>
                        <span className="text-blue-600 text-2xl font-bold">{invoice.invoiceNumber}</span>
                    </DialogTitle>
                </DialogHeader>

                {/* THÔNG TIN CHUNG */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                    <div className="bg-slate-50 p-4 rounded-lg border">
                        <h3 className="font-bold text-gray-500 text-xs uppercase mb-2">Khách Hàng</h3>
                        <p className="font-bold text-lg">{invoice.customer?.name}</p>
                        <p className="text-sm text-gray-600">SĐT: {invoice.customer?.phone}</p>
                        <p className="text-sm text-gray-600">Đ/c: {invoice.customer?.address}</p>
                    </div>

                    <div className="text-right space-y-1">
                        <h3 className="font-bold text-gray-500 text-xs uppercase">Thông Tin Phiếu</h3>
                        <div className="flex justify-end items-center gap-2">
                            <span className="text-sm">Trạng thái:</span>
                            <Badge variant={invoice.status === "PAID" ? "default" : "destructive"}>
                                {invoice.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-gray-600">Ngày tạo: {formatDate(invoice.createdAt)}</p>
                        <p className="text-sm text-gray-600">Người lập: {invoice.createdBy?.fullName}</p>
                        {/* Hiển thị thêm số phiếu xuất kho nếu có */}
                        {invoice.outboundNote?.outboundOrder && (
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Thuộc đơn: {invoice.outboundNote.outboundOrder.orderNumber}
                            </p>
                        )}
                    </div>
                </div>

                {/* BẢNG SẢN PHẨM */}
                <div className="border rounded-lg overflow-hidden mb-6">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px] text-center">STT</TableHead>
                                <TableHead>Sản phẩm</TableHead>
                                <TableHead className="text-center">ĐVT</TableHead> {/* Thêm cột ĐVT cho giống mẫu in */}
                                <TableHead className="text-center">SL</TableHead>
                                <TableHead className="text-right">Đơn giá</TableHead>
                                <TableHead className="text-right">Thành tiền</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoice.details?.map((item: InvoiceDetail, index: number) => (
                                <TableRow key={index}>
                                    <TableCell className="text-center">{index + 1}</TableCell>
                                    <TableCell>
                                        <div className="font-medium">{item.product?.name}</div>
                                        <div className="text-xs text-gray-500">{item.product?.sku}</div>
                                    </TableCell>
                                    <TableCell className="text-center">{item.product?.unit || "Cái"}</TableCell>
                                    <TableCell className="text-center">{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                                    <TableCell className="text-right font-bold">{formatCurrency(item.totalLineAmount)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                {/* TỔNG TIỀN */}
                <div className="flex flex-col items-end gap-2 border-t pt-4">
                    <div className="flex justify-between w-1/3 text-sm">
                        <span className="text-gray-600">Tổng tiền hàng:</span>
                        <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                    </div>
                    <div className="flex justify-between w-1/3 text-sm">
                        <span className="text-gray-600">Thuế (8%):</span>
                        <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                    </div>
                    <div className="w-1/3 h-px bg-gray-200 my-1"></div>
                    <div className="flex justify-between w-1/3 text-xl font-bold text-red-600">
                        <span>Tổng cộng:</span>
                        <span>{formatCurrency(invoice.finalAmount)}</span>
                    </div>
                </div>

                {/* BUTTONS */}
                <div className="flex justify-end mt-6 gap-3">
                    <Button variant="outline" onClick={onClose}>Đóng</Button>

                    {/* --- 5. NÚT IN PDF --- */}
                    <Button
                        onClick={() => handlePrint()}
                        className="bg-blue-600 hover:bg-blue-700 text-white flex gap-2 items-center"
                    >
                        <Printer size={16} />
                        In Hóa Đơn (PDF)
                    </Button>
                </div>

                {/* --- 6. TEMPLATE ẨN (Để in ấn) --- */}
                <div style={{ display: "none" }}>
                    <InvoicePrintTemplate ref={printRef} data={invoice} />
                </div>

            </DialogContent>
        </Dialog>
    );
}