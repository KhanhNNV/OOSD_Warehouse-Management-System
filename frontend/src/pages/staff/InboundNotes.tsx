import { useState } from "react";
import {
    FileText,
    RefreshCw,
    Package,
    Calendar,
    Hash,
    RotateCcw, Eye, ScanBarcode,
    Trash2,
    AlertCircle,
    Loader2,
    Search,   // <--- Mới
    Filter    // <--- Mới
} from "lucide-react";

// Các UI components
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // <--- Mới
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Component Phân trang chung
import { PaginationControls } from "@/components/common/PaginationControls"; // <--- Mới

// Hook và Type
import { useMyInboundNotes } from "@/hooks/useInbound";
import { InboundNoteResponse, InboundStatus } from "@/types/inbound";

// --- Helper Component: Status Badge ---
const InboundStatusBadge = ({ status }: { status: InboundStatus }) => {
    const styles: Record<InboundStatus, string> = {
        DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
        VERIFYING: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
        COMPLETED: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
        CANCELLED: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
        FAILED: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    };

    const labels: Record<InboundStatus, string> = {
        DRAFT: "Nháp",
        VERIFYING: "Đang kiểm",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
        FAILED: "Thất bại",
    };

    return (
        <Badge variant="outline" className={cn("font-medium border", styles[status])}>
            {labels[status] || status}
        </Badge>
    );
};

// --- Main Page Component ---
export default function InboundNotesPage() {
    // 1. Lấy dữ liệu từ Hook (đã cập nhật thêm search và pagination)
    const {
        data,
        loading,
        refetch,
        handleStartCheck,
        isCreating,
        cancelInboundNote,
        isCancelling,
        // Các state mới từ hook (giả định hook đã hỗ trợ)
        searchTerm,
        setSearchTerm,
        pagination
    } = useMyInboundNotes();

    const [selectedNote, setSelectedNote] = useState<InboundNoteResponse | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<InboundNoteResponse | null>(null);

    const handleViewDetail = (note: InboundNoteResponse) => {
        setSelectedNote(note);
        setIsDetailOpen(true);
    };

    const handleDeleteClick = (e: React.MouseEvent, note: InboundNoteResponse) => {
        e.stopPropagation();
        setNoteToDelete(note);
    };

    const onConfirmDelete = () => {
        if (!noteToDelete) return;
        cancelInboundNote(noteToDelete.id, () => {
            setNoteToDelete(null);
            refetch();
        });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Lịch sử nhập kho của tôi"
                description="Danh sách các phiếu nhập kho (Inbound Note) bạn đã thực hiện."
            />

            {/* Filter Bar & Actions */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                {/* Search Bar */}
                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm theo Mã Phiếu, Mã PO..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="w-4 h-4 mr-2" /> Bộ lọc
                    </Button>
                </div>

                {/* Refresh Button */}
                <Button
                    variant="outline"
                    onClick={refetch}
                    disabled={loading}
                    className="gap-2 shrink-0"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                    Làm mới
                </Button>
            </div>

            {/* Main Table */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã Phiếu</TableHead>
                            <TableHead>Mã PO</TableHead>
                            <TableHead>Ngày thực hiện</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[100px] text-center">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tải dữ liệu...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy phiếu nhập nào phù hợp.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((note) => (
                                <TableRow
                                    key={note.id}
                                    className="hover:bg-muted/50 transition-colors"
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium">
                                            <FileText className="w-4 h-4 text-blue-500" />
                                            {note.noteNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Hash className="w-3 h-3" />
                                            {note.poNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-3 h-3" />
                                            {note.receivedDate
                                                ? new Date(note.receivedDate).toLocaleString("vi-VN")
                                                : "-"}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <InboundStatusBadge status={note.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {note.status === 'DRAFT' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity"
                                                    onClick={(e) => handleDeleteClick(e, note)}
                                                    title="Hủy phiếu nhập"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 hover:bg-blue-50 border-blue-200"
                                                disabled={
                                                    note.status !== "DRAFT" ||
                                                    isCreating
                                                }
                                                onClick={() => handleStartCheck(note.purchaseOrderId)}
                                            >
                                                <ScanBarcode className="w-4 h-4 mr-2" />
                                                Kiểm hàng
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleViewDetail(note)}
                                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="border-t bg-muted/20">
                <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.onPageChange}
                    totalItems={pagination.totalItems}
                />
            </div>

            {/* Dialog Detail - Giữ nguyên */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                            Chi tiết phiếu nhập: {selectedNote?.noteNumber}
                        </DialogTitle>
                        <DialogDescription className="flex flex-col gap-1 mt-2">
                            <span>
                                Thuộc đơn hàng (PO): <span className="font-semibold text-foreground">{selectedNote?.poNumber}</span>
                            </span>
                            <span>
                                Người thực hiện: <span className="font-semibold text-foreground">{selectedNote?.processedBy}</span>
                            </span>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border rounded-md mt-4 max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[50px]">ID</TableHead>
                                    <TableHead>Sản phẩm (ID)</TableHead>
                                    <TableHead className="text-right">SL Thực tế</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedNote?.inboundDetails?.map((detail) => (
                                    <TableRow key={detail.id}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {detail.id}
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-medium">Sản phẩm #{detail.productId}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            {detail.actualQty}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground italic text-sm">
                                            {detail.note || "Không có ghi chú"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!selectedNote?.inboundDetails || selectedNote.inboundDetails.length === 0) && (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                            Không có chi tiết sản phẩm
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button variant="secondary" onClick={() => setIsDetailOpen(false)}>
                            Đóng
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog Delete - Giữ nguyên */}
            <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && !isCancelling && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" /> Xác nhận hủy phiếu nhập
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn hủy phiếu nhập <strong>{noteToDelete?.noteNumber}</strong> không?
                            <br />Hành động này sẽ xóa dữ liệu kiểm hàng nháp và không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Thoát</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); onConfirmDelete(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isCancelling}
                        >
                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}