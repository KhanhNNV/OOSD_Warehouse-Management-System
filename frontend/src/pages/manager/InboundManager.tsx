import { useState } from "react";
import { Search, Filter, Eye, AlertTriangle, CheckCircle2, ArrowRight, Truck, XCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area"; // Nếu chưa có thì dùng div thường overflow-auto
import { POStatusBadge } from "@/components/inbound/POStatusBadge";
import { useInbound } from "@/hooks/useInbound";
import { cn } from "@/lib/utils";
import { toast } from "sonner"; // Hoặc useToast tùy thư viện bạn dùng
import { inboundService } from "@/services/inbound.service";
import { PurchaseOrder } from "@/types/inbound";

export default function InboundManager() {
    const { orders, searchTerm, setSearchTerm, refreshData, isLoading } = useInbound();

    // --- STATE ---
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    // State mới: Lưu chi tiết phiếu nhập để hiển thị trong Modal
    const [detailData, setDetailData] = useState<any>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // --- 1. XỬ LÝ DUYỆT (MỞ MODAL SOI CHI TIẾT) ---
    const handleOpenApprove = async (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsApproveOpen(true);
        setDetailData(null); // Reset dữ liệu cũ
        setIsLoadingDetails(true);

        try {
            // Gọi API lấy chi tiết phiếu đang chờ (PENDING)
            // Đảm bảo bạn đã thêm hàm getPendingInboundDetails vào inboundService ở Frontend nhé
            const res = await inboundService.getPendingInboundDetails(po.id);
            if (res.data) {
                setDetailData(res.data);
            }
        } catch (error) {
            toast.error("Không tải được chi tiết phiếu nhập!");
            console.error(error);
        } finally {
            setIsLoadingDetails(false);
        }
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
        } finally {
            setIsProcessing(false);
        }
    };

    // --- 2. XỬ LÝ HỦY ---
    const handleOpenReject = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setRejectReason("");
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
            await inboundService.cancelInbound(selectedPO.id, rejectReason);
            toast.success(`Đã hủy đơn ${selectedPO.poNumber}`);
            setIsRejectOpen(false);
            if (refreshData) refreshData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi hủy đơn");
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
                                    <TableCell><POStatusBadge status={po.status} /></TableCell>
                                    <TableCell className="text-right font-medium text-slate-600">
                                        {po.receivedItems} / {po.totalItems}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(po.expectedDate).toLocaleDateString('vi-VN')}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {po.status === 'DISCREPANCY' && (
                                                <>
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8 w-8 p-0 shadow-sm" onClick={() => handleOpenApprove(po)} title="Duyệt chênh lệch">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8 w-8 p-0 shadow-sm" onClick={() => handleOpenReject(po)} title="Hủy đơn">
                                                        <XCircle className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- MODAL 1: DUYỆT & SOI CHI TIẾT (NÂNG CẤP) --- */}
            <Dialog open={isApproveOpen} onOpenChange={setIsApproveOpen}>
                <DialogContent className="sm:max-w-3xl"> {/* Tăng độ rộng Modal */}
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-green-600 text-xl">
                            <CheckCircle2 className="w-6 h-6" /> Kiểm duyệt nhập kho
                        </DialogTitle>
                        <DialogDescription>
                            Đơn hàng <strong>{selectedPO?.poNumber}</strong> đang có chênh lệch. Vui lòng kiểm tra kỹ.
                        </DialogDescription>
                    </DialogHeader>

                    {/* Vùng hiển thị chi tiết */}
                    <div className="min-h-[300px] border rounded-md bg-white">
                        {isLoadingDetails ? (
                            <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
                                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                                <p>Đang tải dữ liệu đối chiếu...</p>
                            </div>
                        ) : detailData ? (
                            <div className="max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-slate-100 z-10">
                                        <TableRow>
                                            <TableHead>Sản phẩm</TableHead>
                                            <TableHead className="text-center">Thực tế</TableHead>
                                            <TableHead className="text-center">Tình trạng</TableHead>
                                            <TableHead>Ghi chú của Staff</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {detailData.inboundDetails.map((item: any) => {
                                            const isExcess = item.note && item.note.includes("Dư");
                                            const isShort = item.note && item.note.includes("Thiếu");
                                            return (
                                                <TableRow key={item.id} className={isExcess ? "bg-red-50" : isShort ? "bg-amber-50" : ""}>
                                                    <TableCell>
                                                        <div className="font-medium">{item.product.name}</div>
                                                        <div className="text-xs text-slate-500">{item.product.barcode}</div>
                                                    </TableCell>
                                                    <TableCell className="text-center font-bold text-lg">
                                                        {item.actualQty}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        {isExcess && <Badge variant="destructive">Thừa hàng</Badge>}
                                                        {isShort && <Badge className="bg-amber-500 hover:bg-amber-600">Thiếu hàng</Badge>}
                                                        {item.note === "Khớp" && <Badge variant="secondary">Khớp</Badge>}
                                                    </TableCell>
                                                    <TableCell className="text-sm italic text-slate-600">
                                                        {item.note}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-slate-500">
                                Không có dữ liệu chi tiết.
                            </div>
                        )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded text-sm text-slate-600 border border-slate-100">
                        <Truck className="w-4 h-4 inline-block mr-2" />
                        Khi phê duyệt, hệ thống sẽ cập nhật kho theo số lượng <strong>Thực tế</strong> hiển thị ở trên.
                    </div>

                    <DialogFooter className="mt-2">
                        <Button variant="outline" onClick={() => setIsApproveOpen(false)}>Hủy bỏ</Button>
                        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={confirmApprove} disabled={isProcessing || isLoadingDetails}>
                            {isProcessing ? "Đang xử lý..." : "Phê duyệt & Nhập kho"} <ArrowRight className="w-4 h-4 ml-2"/>
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- MODAL 2: HỦY ĐƠN (GIỮ NGUYÊN) --- */}
            <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
                <DialogContent className="sm:max-w-md border-red-200">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
                            <XCircle className="w-6 h-6" /> Từ Chối Nhập Kho
                        </DialogTitle>
                        <DialogDescription>
                            Bạn đang chuẩn bị HỦY đơn hàng <strong>{selectedPO?.poNumber}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="bg-red-50 p-3 rounded-md border border-red-100 text-sm text-red-800">
                            <strong>⚠️ Cảnh báo:</strong> Đơn hàng sẽ chuyển trạng thái sang CANCELLED và hàng hóa sẽ KHÔNG được nhập vào kho.
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Lý do từ chối <span className="text-red-500">*</span></label>
                            <Textarea placeholder="Nhập lý do hủy..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectOpen(false)}>Quay lại</Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={confirmReject} disabled={isProcessing || !rejectReason.trim()}>
                            {isProcessing ? "Đang hủy..." : "Xác nhận Hủy Đơn"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}