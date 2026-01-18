import React from 'react';
import { SupplierInvoiceResponse } from '../../types/supplierInvoice';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { X } from 'lucide-react'; // Icon đóng (nếu bạn có cài lucide-react)

interface Props {
    isOpen: boolean;
    onClose: () => void;
    invoice: SupplierInvoiceResponse | null;
}

const SupplierInvoiceDetailModal: React.FC<Props> = ({ isOpen, onClose, invoice }) => {
    if (!invoice) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const formatDate = (dateString: any) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            {/* max-w-4xl để modal rộng rãi, dễ nhìn */}
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white">

                {/* --- 1. HEADER --- */}
                <div className="flex justify-between items-center p-6 border-b bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Chi Tiết Hóa Đơn Nhập</h2>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-blue-600 tracking-wide block">
                            #{invoice.invoiceNumber}
                        </span>
                    </div>
                </div>

                <div className="p-6">
                    {/* --- 2. THÔNG TIN CHUNG (GRID 2 CỘT) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">

                        {/* Cột Trái: Thông tin Nhà Cung Cấp */}
                        <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                                Nhà Cung Cấp
                            </h3>
                            <p className="text-lg font-bold text-gray-800 mb-1">{invoice.supplierName}</p>
                            {/* Các thông tin phụ nếu API có trả về thì hiện, không thì ẩn */}
                            <p className="text-sm text-gray-600">Mã phiếu nhập: <span className="font-medium text-blue-600">{invoice.inboundNoteCode}</span></p>
                        </div>

                        {/* Cột Phải: Thông tin Hóa Đơn */}
                        <div className="text-right space-y-2">
                            <div>
                                <span className="text-sm text-gray-500 mr-2">Trạng thái:</span>
                                {invoice.status === 'PAID' ? (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0 px-3 py-1">ĐÃ THANH TOÁN</Badge>
                                ) : (
                                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0 px-3 py-1">CHƯA THANH TOÁN</Badge>
                                )}
                            </div>
                            <p className="text-sm text-gray-600">
                                Ngày tạo: <span className="font-medium text-gray-900">{formatDate(invoice.createdAt)}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Người lập: <span className="font-medium text-gray-900">{invoice.createdByName}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Hạn thanh toán: <span className="font-medium text-red-600">{formatDate(invoice.dueDate)}</span>
                            </p>
                        </div>
                    </div>

                    {/* --- 3. BẢNG SẢN PHẨM --- */}
                    <div className="border rounded-lg overflow-hidden mb-6">
                        <Table>
                            <TableHeader className="bg-gray-50">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">STT</TableHead>
                                    <TableHead>Sản Phẩm</TableHead>
                                    <TableHead className="text-center">ĐVT</TableHead>
                                    <TableHead className="text-center">SL</TableHead>
                                    <TableHead className="text-right">Đơn Giá Nhập</TableHead>
                                    <TableHead className="text-right">Thành Tiền</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invoice.details?.map((item, index) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-center text-gray-500">{index + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium text-gray-900">{item.productName}</div>
                                            <div className="text-xs text-gray-500">{item.productSku}</div>
                                        </TableCell>
                                        <TableCell className="text-center">Cái</TableCell>
                                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                                        <TableCell className="text-right text-gray-600">{formatCurrency(item.unitPrice)}</TableCell>
                                        <TableCell className="text-right font-bold text-gray-900">{formatCurrency(item.totalLineAmount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* --- 4. TỔNG KẾT TIỀN --- */}
                    <div className="flex flex-col items-end space-y-3 border-t pt-4">
                        <div className="flex justify-between w-64 text-sm">
                            <span className="text-gray-600">Tổng tiền hàng:</span>
                            <span className="font-medium">{formatCurrency(invoice.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between w-64 text-sm">
                            <span className="text-gray-600">Thuế (VAT 10%):</span>
                            <span className="font-medium">{formatCurrency(invoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between w-64 text-xl font-bold text-red-600 border-t pt-2 mt-2">
                            <span>TỔNG CỘNG:</span>
                            <span>{formatCurrency(invoice.finalAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* --- 5. FOOTER BUTTONS --- */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t">
                    <Button variant="outline" onClick={onClose} className="border-gray-300">
                        Đóng
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        🖨️ Xuất PDF
                    </Button>
                </div>

            </DialogContent>
        </Dialog>
    );
};

export default SupplierInvoiceDetailModal;