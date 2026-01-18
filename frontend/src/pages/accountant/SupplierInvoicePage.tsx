import React, { useEffect, useState } from 'react';
import { supplierInvoiceService } from '../../services/supplierInvoice.service';
import { inboundService } from '../../services/inbound.service'; // Import thêm service lấy phiếu nhập
import { SupplierInvoiceResponse } from '../../types/supplierInvoice';
import SupplierInvoiceCreateModal from './SupplierInvoiceCreateModal';
import SupplierInvoiceDetailModal from './SupplierInvoiceDetailModal';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';

const SupplierInvoicePage = () => {
    // State 1: Danh sách Phiếu nhập CHỜ tạo hóa đơn
    const [pendingNotes, setPendingNotes] = useState<any[]>([]);

    // State 2: Danh sách Hóa đơn ĐÃ tạo
    const [invoices, setInvoices] = useState<SupplierInvoiceResponse[]>([]);

    const [loading, setLoading] = useState(false);

    // Modal State
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

    // State để lưu đối tượng đang được chọn
    const [selectedInboundNote, setSelectedInboundNote] = useState<any>(null); // Để truyền vào Modal tạo
    const [selectedInvoice, setSelectedInvoice] = useState<SupplierInvoiceResponse | null>(null); // Để truyền vào Modal xem

    // Hàm load dữ liệu tổng hợp
    const fetchData = async () => {
        setLoading(true);
        try {
            // Gọi song song 2 API: Lấy list phiếu nhập & Lấy list hóa đơn
            const [allInboundNotes, allInvoices] = await Promise.all([
                inboundService.getAllInboundNotes(),
                supplierInvoiceService.getAll()
            ]);

            // 1. Xử lý danh sách Hóa đơn (Phần dưới)
            setInvoices(allInvoices);

            // 2. Xử lý danh sách Chờ (Phần trên)
            // Logic: Lấy các phiếu COMPLETED trừ đi các phiếu ĐÃ CÓ hóa đơn
            const invoicedCodes = allInvoices.map((inv: any) => inv.inboundNoteCode); // Lấy danh sách mã phiếu đã có HĐ

            const pending = allInboundNotes.filter((note: any) =>
                note.status === 'COMPLETED' &&     // Phải nhập kho xong
                !invoicedCodes.includes(note.noteNumber) // Và chưa có trong danh sách hóa đơn
            );

            setPendingNotes(pending);

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Xử lý khi bấm nút "Tạo HĐ" ở bảng trên
    const handleCreateClick = (note: any) => {
        setSelectedInboundNote(note); // Lưu phiếu nhập được chọn
        setIsCreateModalOpen(true);   // Mở Modal
    };

    // Xử lý khi bấm nút "Xem" ở bảng dưới
    const handleViewDetail = (invoice: SupplierInvoiceResponse) => {
        setSelectedInvoice(invoice);
        setIsDetailModalOpen(true);
    };

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-blue-800 mb-6">🧾 Kế Toán - Quản Lý Hóa Đơn Nhập (NCC)</h1>

            {/* --- PHẦN 1: DANH SÁCH CHỜ (PENDING) --- */}
            <div className="mb-8 bg-white rounded-lg shadow border border-blue-100">
                <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center rounded-t-lg">
                    <h3 className="font-bold text-blue-700 flex items-center gap-2">
                        📦 Phiếu nhập kho chờ tạo hóa đơn
                        <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{pendingNotes.length}</span>
                    </h3>
                </div>

                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Mã Phiếu Nhập</TableHead>
                                <TableHead>Mã PO</TableHead>
                                <TableHead>Ngày Nhập</TableHead>
                                <TableHead>Người Phụ Trách</TableHead>
                                <TableHead className="text-center">Hành Động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-4">Đang tải...</TableCell></TableRow>
                            ) : pendingNotes.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="text-center py-6 text-gray-400 italic">Không có phiếu nhập nào cần xử lý</TableCell></TableRow>
                            ) : (
                                pendingNotes.map((note) => (
                                    <TableRow key={note.id}>
                                        <TableCell className="font-medium">{note.noteNumber}</TableCell>
                                        <TableCell>{note.poNumber || note.purchaseOrder?.poNumber}</TableCell>
                                        <TableCell>{new Date(note.receivedDate).toLocaleDateString('vi-VN')}</TableCell>
                                        <TableCell>{note.processedBy || "Thủ kho"}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                size="sm"
                                                className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                                                onClick={() => handleCreateClick(note)}
                                            >
                                                <span className="mr-1">💲</span> Tạo HĐ
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- PHẦN 2: LỊCH SỬ HÓA ĐƠN (HISTORY) --- */}
            <div className="bg-white rounded-lg shadow border">
                <div className="p-4 bg-gray-50 border-b flex justify-between items-center rounded-t-lg">
                    <h3 className="font-bold text-gray-700">📜 Lịch sử hóa đơn đã lập</h3>
                </div>

                <div className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Số Hóa Đơn</TableHead>
                                <TableHead>Từ Phiếu Nhập</TableHead>
                                <TableHead>Nhà Cung Cấp</TableHead>
                                <TableHead className="text-right">Tổng Tiền</TableHead>
                                <TableHead className="text-center">Trạng Thái</TableHead>
                                <TableHead className="text-center">Chi Tiết</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length === 0 ? (
                                <TableRow><TableCell colSpan={6} className="text-center py-6 text-gray-400">Chưa có hóa đơn nào</TableCell></TableRow>
                            ) : (
                                invoices.map((inv) => (
                                    <TableRow key={inv.id} className="hover:bg-gray-50">
                                        <TableCell className="font-bold text-blue-600">{inv.invoiceNumber}</TableCell>
                                        <TableCell><Badge variant="secondary">{inv.inboundNoteCode}</Badge></TableCell>
                                        <TableCell>{inv.supplierName}</TableCell>
                                        <TableCell className="text-right font-bold text-gray-800">
                                            {formatCurrency(inv.finalAmount)}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {inv.status === 'PAID'
                                                ? <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Đã Thanh Toán</Badge>
                                                : <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Chờ Thanh Toán</Badge>
                                            }
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="sm" onClick={() => handleViewDetail(inv)}>
                                                👁️ Xem
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* --- MODALS --- */}

            {/* Modal Tạo (Có truyền phiếu nhập vào để khóa Dropdown) */}
            {isCreateModalOpen && (
                <SupplierInvoiceCreateModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    inboundNote={selectedInboundNote} // 👇 Truyền phiếu được chọn vào đây
                    onSuccess={() => {
                        setIsCreateModalOpen(false);
                        fetchData(); // Load lại cả 2 bảng
                    }}
                />
            )}

            {/* Modal Xem Chi Tiết */}
            <SupplierInvoiceDetailModal
                isOpen={isDetailModalOpen}
                onClose={() => setIsDetailModalOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default SupplierInvoicePage;