import { useState } from "react";
import { Search, Filter, Eye, AlertTriangle, CheckCircle2, ArrowRight, Truck, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.tsx";
import { POStatusBadge } from "@/components/inbound/POStatusBadge.tsx";
import { usePoForStaff } from "@/hooks/usePoForStaff.ts";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import { inboundService } from "@/services/inbound.service.ts";
import { PurchaseOrder } from "@/types/inbound";
import { Textarea } from "@/components/ui/textarea.tsx"; // Nhớ import cái này

export default function InboundManager() {
    const { orders, searchTerm, setSearchTerm, refreshData, isLoading } = usePoForStaff();

    // --- STATE DUYỆT (APPROVE) ---
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);

    // --- STATE HỦY (REJECT) - MỚI ---
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const [isProcessing, setIsProcessing] = useState(false);

    // 1. XỬ LÝ DUYỆT
    const handleOpenApprove = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsApproveOpen(true);
    };

    const confirmApprove = async () => {
        if (!selectedPO) return;
        try {
            setIsProcessing(true);
            await inboundService.approveInboundResult(selectedPO.id);
            toast.success(`Đã duyệt nhập kho đơn ${selectedPO.poNumber}`);
            setIsApproveOpen(false);
            if (refreshData) refreshData();
        } catch (error: any) {
            toast.error("Lỗi khi duyệt đơn hàng");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    // 2. XỬ LÝ HỦY (MỚI)
    const handleOpenReject = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setRejectReason(""); // Reset lý do
        setIsRejectOpen(true);
    };

    const confirmReject = async () => {
        if (!selectedPO) return;
        if (!rejectReason.trim()) {
            toast.warning("Vui lòng nhập lý do hủy đơn!");
            return;
        }

        try {
            setIsProcessing(true);
            // Gọi hàm service vừa thêm
            await inboundService.cancelInbound(selectedPO.id, rejectReason);

            toast.success(`Đã hủy đơn ${selectedPO.poNumber} thành công!`);
            setIsRejectOpen(false);
            if (refreshData) refreshData();
        } catch (error: any) {
            // Lấy message lỗi từ backend trả về (nếu có)
            const msg = error.response?.data || "Lỗi khi hủy đơn hàng";
            toast.error(msg);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Duyệt Nhập Kho (Manager)"
                description="Kiểm tra và xử lý các đơn hàng có chênh lệch (Discrepancy)."
                action={<Button variant="outline" onClick={() => refreshData && refreshData()}>Làm mới dữ liệu</Button>}
            />

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo PO, Nhà cung cấp..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Bộ lọc</Button>
            </div>

            {/* Main Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã PO</TableHead>
                            <TableHead>Nhà cung cấp</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Tiến độ</TableHead>
                            <TableHead>Ngày dự kiến</TableHead>
                            <TableHead className="w-[150px] text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Đang tải dữ liệu...</TableCell></TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow><TableCell colSpan={6} className="text-center h-24">Không có đơn hàng nào</TableCell></TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow key={po.id} className={cn("hover:bg-muted/50 transition-colors", po.status === 'DISCREPANCY' && "bg-orange-50/60")}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-700">{po.poNumber}</span>
                                            {po.status === 'DISCREPANCY' && <AlertTriangle className="w-4 h-4 text-orange-600 animate-pulse" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell>
                                        <POStatusBadge status={po.status} />
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-slate-600">
                                        {po.receivedItems} / {po.totalItems}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {new Date(po.expectedDate).toLocaleDateString('vi-VN')}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {/* Logic nút bấm: Chỉ hiện khi trạng thái là DISCREPANCY */}
                                            {po.status === 'DISCREPANCY' && (
                                                <>
                                                    {/* Nút DUYỆT (Xanh) */}
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0 shadow-sm"
                                                        onClick={() => handleOpenApprove(po)}
                                                        title="Duyệt chênh lệch"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>

                                                    {/* Nút HỦY (Đỏ) - MỚI */}
                                                    <Button
                                                        size="sm"
                                                        className="bg-red-600 hover:bg-red-700 text-white h-8 w-8 p-0 shadow-sm"
                                                        onClick={() => handleOpenReject(po)}
                                                        title="Hủy đơn / Từ chối"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600"><Eye className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- MODAL 1: DUYỆT LỆCH KHO --- */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600 text-xl">
                            <CheckCircle2 className="w-6 h-6" />
                            Xác nhận nhập kho
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Bạn đang thực hiện phê duyệt cho đơn hàng <strong>{selectedPO?.poNumber}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-3 mt-2">
                        <p className="font-semibold text-slate-700 flex items-center gap-2">
                            <Truck className="w-4 h-4"/> Hành động hệ thống:
                        </p>
                        <ul className="space-y-2 text-slate-600 list-disc pl-5">
                            <li>Trạng thái đơn hàng chuyển sang <span className="text-green-600 font-bold bg-green-50 px-1 rounded">COMPLETED</span>.</li>
                            <li>Hàng nhập vào kho chờ: <span className="font-mono bg-white border px-1.5 py-0.5 ml-1 rounded text-slate-800 font-bold">STAGE_LOC</span>.</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy bỏ</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove} disabled={isProcessing}>
                            {isProcessing ? "Đang xử lý..." : "Xác nhận & Nhập kho"} <ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL 2: HỦY ĐƠN (MỚI) --- */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="sm:max-w-md border-red-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
                            <XCircle className="w-6 h-6" />
                            Từ Chối Nhập Kho
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Bạn đang chuẩn bị HỦY đơn hàng <strong>{selectedPO?.poNumber}</strong>. Hành động này không thể hoàn tác.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-2">
                        <div className="bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800">
                            <strong>⚠️ Cảnh báo:</strong> Đơn hàng sẽ chuyển trạng thái sang CANCELLED và hàng hóa sẽ KHÔNG được nhập vào kho.
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Lý do từ chối <span className="text-red-500">*</span></label>
                            <Textarea
                                placeholder="Nhập lý do (VD: Hàng hư hỏng quá nhiều, sai quy cách...)"
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                className="resize-none focus:ring-red-500"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Quay lại</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={confirmReject}
                            disabled={isProcessing || !rejectReason.trim()}
                        >
                            {isProcessing ? "Đang hủy..." : "Xác nhận Hủy Đơn"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}