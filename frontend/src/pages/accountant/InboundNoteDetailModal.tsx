import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    note: any; // Dùng tạm any vì chưa có type InboundNote chuẩn ở đây
}

const InboundNoteDetailModal: React.FC<Props> = ({ isOpen, onClose, note }) => {
    if (!note) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl bg-white p-0 overflow-hidden">
                {/* HEADER */}
                <div className="flex justify-between items-center p-6 border-b bg-blue-50">
                    <DialogTitle className="text-xl font-bold text-blue-800">
                        📦 Chi Tiết Phiếu Nhập Kho
                    </DialogTitle>
                    <div className="text-right">
                        <span className="text-lg font-bold text-gray-700 block">{note.noteNumber}</span>
                        <span className="text-xs text-gray-500">PO: {note.poNumber || note.purchaseOrder?.poNumber}</span>
                    </div>
                </div>

                <div className="p-6">
                    {/* THÔNG TIN CHUNG */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                        <div>
                            <p className="text-gray-500">Ngày nhập:</p>
                            <p className="font-medium">{new Date(note.receivedDate).toLocaleString('vi-VN')}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-gray-500">Người phụ trách:</p>
                            <p className="font-medium">{note.processedBy || note.processedByUser?.fullName || "Thủ kho"}</p>
                        </div>
                    </div>

                    {/* BẢNG SẢN PHẨM */}
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader className="bg-gray-100">
                                <TableRow>
                                    <TableHead className="w-[50px] text-center">STT</TableHead>
                                    <TableHead>Mã SP (SKU)</TableHead>
                                    <TableHead>Tên Sản Phẩm</TableHead>
                                    <TableHead className="text-center">Số Lượng Nhập</TableHead>
                                    <TableHead>Ghi Chú</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {/* Kiểm tra xem có chi tiết không */}
                                {note.inboundDetails && note.inboundDetails.length > 0 ? (
                                    note.inboundDetails.map((item: any, index: number) => (
                                        <TableRow key={item.id}>
                                            <TableCell className="text-center">{index + 1}</TableCell>
                                            <TableCell className="font-mono text-xs">{item.product?.sku || item.productSku}</TableCell>
                                            <TableCell className="font-medium">{item.product?.name || item.productName}</TableCell>
                                            <TableCell className="text-center font-bold text-blue-600">
                                                {item.actualQty}
                                            </TableCell>
                                            <TableCell className="text-gray-500 italic text-xs">{item.note || "-"}</TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-4 text-gray-400">
                                            Không có thông tin chi tiết
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Đóng</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default InboundNoteDetailModal;