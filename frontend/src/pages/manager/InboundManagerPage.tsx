import { useState } from "react";
import {
    Eye, CheckCircle, XCircle, RefreshCw, Loader2, Package, AlertCircle, Upload, Search,Trash2
} from "lucide-react";

// --- Imports từ hệ thống Component của bạn (Shadcn UI) ---
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge"; // Giả sử bạn có component Badge, nếu chưa có tôi sẽ dùng div + tailwind bên dưới
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// --- Imports Logic & Types ---
import { useInboundManager } from '@/hooks/useInboundManager';
import { InboundNoteResponse, InboundStatus } from '@/types/inbound';
import {Input} from "@/components/ui/input.tsx";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Helper render màu sắc trạng thái bằng Tailwind classes
const renderStatusBadge = (status: InboundStatus) => {
    const styles: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        VERIFYING: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200", // Đang chờ duyệt
        COMPLETED: "bg-green-100 text-green-800 hover:bg-green-200 border-green-200",
        FAILED: "bg-red-100 text-red-800 hover:bg-red-200 border-red-200",
        CANCELLED: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200",
    };

    const labels: Record<string, string> = {
        DRAFT: "Nháp",
        VERIFYING: "Chờ duyệt",
        COMPLETED: "Hoàn thành",
        FAILED: "Thất bại",
        CANCELLED: "Đã hủy",
    };

    return (
        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", styles[status] || styles.DRAFT)}>
            {labels[status] || status}
        </span>
    );
};

export default function InboundManagerPage() {
    // 1. Logic Hook (Giữ nguyên)
    const {
        inboundNotes,
        loading,
        processingId,
        refresh,
        onApprove,
        onReject,
        searchTerm,
        setSearchTerm,
        onCancel
    } = useInboundManager();

    // 2. State Modal (Giữ nguyên)
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<InboundNoteResponse | null>(null);

    const [noteToDelete, setNoteToDelete] = useState<InboundNoteResponse | null>(null);

    // Handlers
    const handleViewDetail = (record: InboundNoteResponse) => {
        setSelectedNote(record);
        setIsModalOpen(true);
    };

    // Handler wrapper để đóng modal sau khi duyệt (nếu cần)
    const handleApproveInModal = () => {
        if (selectedNote) {
            onApprove(selectedNote.id);
            setIsModalOpen(false);
        }
    };

    // Handler mở dialog hủy
    const handleCancelClick = (e: React.MouseEvent, note: InboundNoteResponse) => {
        e.stopPropagation(); // Ngăn mở modal chi tiết
        setNoteToDelete(note);
    };

    // Handler xác nhận hủy
    const confirmCancel = () => {
        if (!noteToDelete) return;
        onCancel(noteToDelete.id, () => {
            setNoteToDelete(null); // Đóng dialog khi thành công
            if(refresh) refresh();
        });
    };
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    };

    return (
        <div className="animate-fade-in space-y-6">

            {/* --- PAGE HEADER --- */}
            <PageHeader
                title="Quản lý phiếu nhập kho"
                description="Quản lý phiếu nhập kho và chi tiết phiếu nhập."
            />
            {/* Filter */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã PO, tên NCC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* --- MAIN CONTENT (TABLE) --- */}
            <div className="border rounded-md shadow-sm bg-card flex-1 overflow-hidden flex flex-col">
                <ScrollArea className="h-[600px]">
                    <Table>
                        <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                                <TableHead className="w-[150px]">Mã Phiếu</TableHead>
                                <TableHead>Mã PO</TableHead>
                                <TableHead>Ngày Nhập</TableHead>
                                <TableHead>Người Xử Lý</TableHead>
                                <TableHead>Trạng Thái</TableHead>
                                <TableHead className="text-right">Hành Động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && inboundNotes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center items-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : inboundNotes.length > 0 ? (
                                inboundNotes.map((note) => {
                                    const isProcessing = processingId === note.id;
                                    const canAction = note.status === 'VERIFYING';
                                    const canCancel = note.status === 'DRAFT';

                                    return (
                                        <TableRow key={note.id} className="hover:bg-muted/5">
                                            <TableCell className="font-semibold">{note.noteNumber}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-muted-foreground" />
                                                    {note.poNumber}
                                                </div>
                                            </TableCell>
                                            <TableCell>{formatDate(note.receivedDate)}</TableCell>
                                            <TableCell>{note.processedBy}</TableCell>
                                            <TableCell>{renderStatusBadge(note.status)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end items-center gap-1">
                                                    <TooltipProvider>
                                                        {canCancel && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-slate-400 hover:text-red-600 transition-opacity mr-1"
                                                                onClick={(e) => handleCancelClick(e, note)}
                                                                title="Hủy phiếu"
                                                                disabled={isProcessing}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        {/* Nút Xem Chi Tiết */}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleViewDetail(note)}
                                                                >
                                                                    <Eye className="h-4 w-4 text-slate-500" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>Xem chi tiết</TooltipContent>
                                                        </Tooltip>

                                                        {/* Các nút hành động (Chỉ hiện khi Waiting) */}
                                                        {canAction && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="hover:bg-green-100 hover:text-green-700"
                                                                            onClick={() => onApprove(note.id)}
                                                                            disabled={isProcessing}
                                                                        >
                                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Duyệt phiếu</TooltipContent>
                                                                </Tooltip>

                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="hover:bg-red-100 hover:text-red-700"
                                                                            onClick={() => onReject(note.id)}
                                                                            disabled={isProcessing}
                                                                        >
                                                                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 text-red-600" />}
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>Từ chối</TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                        Không có phiếu nhập kho nào.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </ScrollArea>
            </div>

            {/* --- DIALOG DETAIL (MODAL) --- */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Chi tiết phiếu nhập: {selectedNote?.noteNumber}</DialogTitle>
                        <DialogDescription>
                            Kiểm tra kỹ thông tin sản phẩm và số lượng thực tế trước khi duyệt.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedNote && (
                        <div className="space-y-4 py-4">
                            {/* Thông tin chung */}
                            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border text-sm">
                                <div><span className="font-semibold">PO Gốc:</span> {selectedNote.poNumber}</div>
                                <div><span className="font-semibold">Người tạo:</span> {selectedNote.processedBy}</div>
                                <div><span className="font-semibold">Ngày nhận:</span> {formatDate(selectedNote.receivedDate)}</div>
                                <div><span className="font-semibold">Trạng thái:</span> {renderStatusBadge(selectedNote.status)}</div>
                            </div>

                            {/* Bảng chi tiết sản phẩm */}
                            <div className="border rounded-md overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted">
                                        <TableRow>
                                            <TableHead>Sản Phẩm</TableHead>
                                            <TableHead className="text-center">SL Thực Tế</TableHead>
                                            <TableHead>Ghi Chú</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedNote.inboundDetails.map((detail, index) => (
                                            <TableRow key={index}>
                                                <TableCell className="font-medium">
                                                    {detail.productName || `Sản phẩm #${detail.productId}`}
                                                </TableCell>
                                                <TableCell className="text-center font-bold">
                                                    {detail.actualQty}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground text-sm italic">
                                                    {detail.note || "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                            Đóng
                        </Button>
                        {selectedNote?.status === 'VERIFYING' && (
                            <Button
                                onClick={handleApproveInModal}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Duyệt ngay
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertCircle className="w-5 h-5" /> Xác nhận hủy phiếu nhập
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn có chắc chắn muốn hủy phiếu nhập <strong>{noteToDelete?.noteNumber}</strong> không?
                            <br />Hành động này sẽ chuyển trạng thái phiếu sang "CANCELLED" và không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={!!processingId}>Thoát</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); confirmCancel(); }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={!!processingId}
                        >
                            {processingId === noteToDelete?.id ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}
                            Xác nhận hủy
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}