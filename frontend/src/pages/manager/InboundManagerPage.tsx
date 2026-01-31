import { useState } from "react";
import {
    Eye, CheckCircle, XCircle, Loader2, Package, AlertCircle, Search, Trash2, Filter, RotateCcw, Calendar
} from "lucide-react";

// --- Imports Shadcn UI ---
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// --- Imports Logic & Types ---
import { useInboundManager } from '@/hooks/useInboundManager';
import { InboundNoteResponse, InboundStatus } from '@/types/inbound';

// Helper render màu sắc trạng thái
const renderStatusBadge = (status: InboundStatus) => {
    const styles: Record<string, string> = {
        DRAFT: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        VERIFYING: "bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200",
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
    // Logic Hook
    const {
        inboundNotes,
        loading,
        processingId,
        refresh,
        onApprove,
        onReject,
        onCancel,
        // Filter states form hook
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters
    } = useInboundManager();

    // Local UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<InboundNoteResponse | null>(null);
    const [noteToDelete, setNoteToDelete] = useState<InboundNoteResponse | null>(null);

    // Handlers
    const handleViewDetail = (record: InboundNoteResponse) => {
        setSelectedNote(record);
        setIsModalOpen(true);
    };

    const handleApproveInModal = () => {
        if (selectedNote) {
            onApprove(selectedNote.id);
            setIsModalOpen(false);
        }
    };

    const handleCancelClick = (e: React.MouseEvent, note: InboundNoteResponse) => {
        e.stopPropagation();
        setNoteToDelete(note);
    };

    const confirmCancel = () => {
        if (!noteToDelete) return;
        onCancel(noteToDelete.id, () => {
            setNoteToDelete(null);
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

            {/* --- FILTER BAR (Mới thêm) --- */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Filter className="w-4 h-4" /> Bộ lọc tìm kiếm
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Search Text */}
                    <div className="lg:col-span-2">
                        <Label className="text-xs mb-1.5 block">Từ khóa</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Tìm theo mã phiếu, PO, người xử lý..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                    </div>

                    {/* 2. Status Filter */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Trạng thái</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="DRAFT">Nháp</SelectItem>
                                <SelectItem value="VERIFYING">Chờ duyệt</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Date Range Filter */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Ngày nhập</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {filterFromDate || filterToDate ? (
                                        <span className="truncate">
                                            {filterFromDate ? new Date(filterFromDate).toLocaleDateString('vi-VN') : '...'} - {filterToDate ? new Date(filterToDate).toLocaleDateString('vi-VN') : '...'}
                                        </span>
                                    ) : (
                                        <span>Chọn khoảng ngày</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3" align="end">
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Từ ngày</Label>
                                        <Input
                                            type="date"
                                            value={filterFromDate}
                                            onChange={(e) => setFilterFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Đến ngày</Label>
                                        <Input
                                            type="date"
                                            value={filterToDate}
                                            onChange={(e) => setFilterToDate(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
                <p>Hiển thị <strong>{inboundNotes.length}</strong> phiếu nhập</p>
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
                                        Không tìm thấy phiếu nhập nào phù hợp.
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

            {/* --- ALERT DIALOG DELETE --- */}
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