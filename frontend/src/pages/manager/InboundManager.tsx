import { useState } from "react";
import { Search, Filter, Eye, AlertTriangle, CheckCircle2, ArrowRight, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog.tsx";
import { POStatusBadge } from "@/components/inbound/POStatusBadge.tsx";
import { useInbound } from "@/hooks/useInbound.ts";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner"; // Hoặc hook toast của bạn
import { inboundService } from "@/services/inbound.service.ts";
import { PurchaseOrder } from "@/types/inbound";

export default function InboundManager() {
    // Tái sử dụng hook lấy dữ liệu PO (đỡ phải viết lại)
    const { orders, searchTerm, setSearchTerm, refreshData, isLoading } = useInbound();

    // State cho Modal duyệt
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Hàm mở modal duyệt
    const handleOpenApprove = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsApproveOpen(true);
    };

    // Hàm gọi API duyệt
    const confirmApprove = async () => {
        if (!selectedPO) return;
        try {
            setIsProcessing(true);
            // Gọi service duyệt (chấp nhận cả string/number id)
            await inboundService.approveInboundResult(selectedPO.id);

            toast.success(`Đã duyệt nhập kho đơn ${selectedPO.poNumber}`);
            setIsApproveOpen(false);

            // Tải lại dữ liệu
            if (refreshData) refreshData();

        } catch (error) {
            toast.error("Lỗi khi duyệt đơn hàng");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Duyệt Nhập Kho (Manager)"
                description="Kiểm tra và xử lý các đơn hàng có chênh lệch (Discrepancy)."
                // Manager không cần nút Upload Excel, thay bằng nút Refresh hoặc Báo cáo
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
                            <TableHead className="w-[120px] text-right">Hành động</TableHead>
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
                                            {/* Icon cảnh báo nếu lệch */}
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
                                            {/* Nút DUYỆT (Chỉ hiện khi trạng thái là DISCREPANCY) */}
                                            {po.status === 'DISCREPANCY' && (
                                                <Button
                                                    size="sm"
                                                    className="bg-orange-600 hover:bg-orange-700 text-white h-8 px-3 shadow-sm"
                                                    onClick={() => handleOpenApprove(po)}
                                                    title="Duyệt chênh lệch"
                                                >
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5" /> Duyệt
                                                </Button>
                                            )}

                                            {/* Nút Xem chi tiết */}
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-blue-600"><Eye className="w-4 h-4" /></Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- MODAL DUYỆT LỆCH KHO --- */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600 text-xl">
                            <AlertTriangle className="w-6 h-6" />
                            Xác nhận nhập kho lệch
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Bạn đang thực hiện phê duyệt cho đơn hàng <strong>{selectedPO?.poNumber}</strong> có sự chênh lệch số lượng.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-sm space-y-3 mt-2">
                        <p className="font-semibold text-slate-700 flex items-center gap-2">
                            <Truck className="w-4 h-4"/> Hành động hệ thống:
                        </p>
                        <ul className="space-y-2 text-slate-600 list-disc pl-5">
                            <li>Trạng thái đơn hàng chuyển sang <span className="text-green-600 font-bold bg-green-50 px-1 rounded">COMPLETED</span>.</li>
                            <li>
                                Toàn bộ số lượng thực tế sẽ được nhập vào kho tạm:
                                <span className="font-mono bg-white border px-1.5 py-0.5 ml-1 rounded text-slate-800 font-bold">STAGE_LOC</span>.
                            </li>
                            <li>Ngày sản xuất & hết hạn được gán mặc định là <span className="font-medium">Hôm nay</span>.</li>
                        </ul>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy bỏ</Button>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white" onClick={confirmApprove} disabled={isProcessing}>
                            {isProcessing ? "Đang xử lý..." : "Xác nhận & Nhập kho"} <ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}