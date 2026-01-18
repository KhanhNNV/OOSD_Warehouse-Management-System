import React, { useState, useEffect } from 'react';
import { useToast } from '../../hooks/use-toast';
import { supplierInvoiceService } from '../../services/supplierInvoice.service';
import { inboundService } from '../../services/inbound.service'; // 👇 Import thêm service này
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    // 👇 SỬA: Thêm dấu ? để không bắt buộc phải truyền vào
    inboundNote?: any;
    onSuccess: () => void;
}

const SupplierInvoiceCreateModal: React.FC<Props> = ({ isOpen, onClose, inboundNote, onSuccess }) => {
    const { toast } = useToast();

    // State lưu ID phiếu nhập được chọn (Lấy từ props HOẶC người dùng tự chọn)
    const [selectedNoteId, setSelectedNoteId] = useState<number | null>(inboundNote?.id || null);

    // Danh sách phiếu nhập chờ xử lý (dùng cho Dropdown)
    const [pendingNotes, setPendingNotes] = useState<any[]>([]);

    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [loading, setLoading] = useState(false);

    // 👇 EFFECT: Nếu mở modal mà KHÔNG có inboundNote truyền vào -> Tự đi tải danh sách
    useEffect(() => {
        if (isOpen && !inboundNote) {
            fetchPendingNotes();
            // Reset form
            setSelectedNoteId(null);
            setInvoiceNumber('');
            setDueDate('');
        } else if (isOpen && inboundNote) {
            // Nếu có props truyền vào thì set cứng ID
            setSelectedNoteId(inboundNote.id);
        }
    }, [isOpen, inboundNote]);

    const fetchPendingNotes = async () => {
        try {
            const res = await inboundService.getAllInboundNotes();
            // Chỉ lấy các phiếu đã COMPLETED (Nhập kho xong mới được thanh toán)
            const completedNotes = res.filter((n: any) => n.status === 'COMPLETED');
            setPendingNotes(completedNotes);
        } catch (error) {
            console.error("Lỗi tải phiếu nhập:", error);
        }
    };

    const handleSubmit = async () => {
        if (!selectedNoteId) {
            toast({ title: "Lỗi", description: "Vui lòng chọn phiếu nhập kho!", variant: "destructive" });
            return;
        }
        if (!invoiceNumber) {
            toast({ title: "Lỗi", description: "Vui lòng nhập số hóa đơn", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            await supplierInvoiceService.create({
                inboundNoteId: selectedNoteId, // Dùng ID từ state
                invoiceNumber: invoiceNumber,
                dueDate: dueDate ? new Date(dueDate).toISOString() : undefined
            });

            toast({ title: "Thành công", description: "Đã tạo hóa đơn công nợ!" });
            onSuccess();
            onClose();
        } catch (error: any) {
            // Check lỗi trùng số hóa đơn hoặc phiếu đã có hóa đơn
            const msg = error.response?.data?.message || "Lỗi hệ thống";
            toast({ title: "Thất bại", description: msg, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Tạo Hóa Đơn Nhập Kho</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">

                    {/* 👇 LOGIC HIỂN THỊ THÔNG MINH */}
                    {inboundNote ? (
                        // Trường hợp 1: Đã truyền phiếu nhập vào (Từ nút ở bảng danh sách phiếu nhập)
                        <div className="bg-slate-100 p-3 rounded text-sm mb-2">
                            <p>Phiếu nhập: <strong>{inboundNote.noteNumber}</strong></p>
                            <p>PO: <strong>{inboundNote.poNumber || inboundNote.purchaseOrder?.poNumber}</strong></p>
                        </div>
                    ) : (
                        // Trường hợp 2: Tạo mới tự do -> Hiện Dropdown chọn
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="noteSelect" className="text-right">Chọn Phiếu *</Label>
                            <select
                                id="noteSelect"
                                className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={selectedNoteId || ''}
                                onChange={(e) => setSelectedNoteId(Number(e.target.value))}
                            >
                                <option value="">-- Chọn phiếu nhập kho --</option>
                                {pendingNotes.map((note) => (
                                    <option key={note.id} value={note.id}>
                                        {note.noteNumber} (PO: {note.poNumber || note.purchaseOrder?.poNumber})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="invNum" className="text-right">Số HĐ Đỏ *</Label>
                        <Input
                            id="invNum"
                            value={invoiceNumber}
                            onChange={(e) => setInvoiceNumber(e.target.value)}
                            className="col-span-3"
                            placeholder="VD: HD-00123"
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="date" className="text-right">Hạn TT</Label>
                        <Input
                            id="date"
                            type="datetime-local"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Đang xử lý..." : "Xác nhận"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default SupplierInvoiceCreateModal;