import { useState } from "react";
import {
    FileText, RefreshCw, Package, Calendar, Hash, RotateCcw, Eye, ScanBarcode,
    Trash2, AlertCircle, Loader2, Search, Filter
} from "lucide-react";

// UI Components
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

// Common
import { PaginationControls } from "@/components/common/PaginationControls";
import { useMyInboundNotes } from "@/hooks/useInbound";
import { InboundNoteResponse, InboundStatus } from "@/types/inbound";

// --- Helper Component: Status Badge ---
const InboundStatusBadge = ({ status }: { status: InboundStatus }) => {
    const styles: Record<InboundStatus, string> = {
        DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200",
        VERIFYING: "bg-blue-100 text-blue-800 border-blue-200",
        COMPLETED: "bg-green-100 text-green-800 border-green-200",
        CANCELLED: "bg-slate-100 text-slate-800 border-slate-200",
        FAILED: "bg-red-100 text-red-800 border-red-200",
    };

    const labels: Record<InboundStatus, string> = {
        DRAFT: "Nháp",
        VERIFYING: "Đang kiểm",
        COMPLETED: "Hoàn thành",
        CANCELLED: "Đã hủy",
        FAILED: "Thất bại",
    };

    return (
        <Badge variant="outline" className={cn("font-medium border whitespace-nowrap", styles[status])}>
            {labels[status] || status}
        </Badge>
    );
};

// --- Main Page Component ---
export default function InboundNotesPage() {
    const {
        data,
        loading,
        refetch,
        handleStartCheck,
        isCreating,
        cancelInboundNote,
        isCancelling,
        // Filter & Pagination vars
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,
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
        });
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <PageHeader
                title="Lịch sử nhập kho"
                description="Danh sách các phiếu nhập kho (Inbound Note) bạn đã thực hiện."
            />

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Filter className="w-4 h-4" /> Bộ lọc tìm kiếm
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500">
                            <RotateCcw className="w-4 h-4 mr-1" /> Reset
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* 1. Search */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Từ khóa</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Mã phiếu, Mã PO..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white"
                            />
                        </div>
                    </div>

                    {/* 2. Status */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Trạng thái</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Tất cả" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="DRAFT">Nháp</SelectItem>
                                <SelectItem value="VERIFYING">Đang kiểm hàng</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Date Range (Chiếm 2 cột trên màn hình lớn) */}
                    <div className="lg:col-span-2">
                        <Label className="text-xs mb-1.5 block">Ngày thực hiện</Label>
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
                                        <Input type="date" value={filterFromDate} onChange={(e) => setFilterFromDate(e.target.value)} />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Đến ngày</Label>
                                        <Input type="date" value={filterToDate} onChange={(e) => setFilterToDate(e.target.value)} />
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-card rounded-xl border overflow-hidden flex flex-col shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã Phiếu</TableHead>
                            <TableHead>Mã PO</TableHead>
                            <TableHead>Ngày thực hiện</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[120px] text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Đang tải dữ liệu...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                    <Package className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                    Không tìm thấy phiếu nhập nào phù hợp.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((note) => (
                                <TableRow
                                    key={note.id}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => handleViewDetail(note)} // Click row để xem chi tiết
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium text-blue-700">
                                            <FileText className="w-4 h-4" />
                                            {note.noteNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Hash className="w-3 h-3" />
                                            {note.poNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-sm text-muted-foreground">
                                            {note.receivedDate
                                                ? new Date(note.receivedDate).toLocaleString("vi-VN", {
                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                    hour: '2-digit', minute: '2-digit'
                                                })
                                                : "-"}
                                        </div>
                                    </TableCell>

                                    <TableCell>
                                        <InboundStatusBadge status={note.status} />
                                    </TableCell>

                                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex justify-end gap-1">
                                            {note.status === 'DRAFT' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                                    onClick={(e) => handleDeleteClick(e, note)}
                                                    title="Hủy phiếu"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}

                                            {/* Nút Kiểm hàng chỉ hiện khi Draft */}
                                            {note.status === 'DRAFT' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-8 border-blue-200 text-blue-600 hover:bg-blue-50 gap-1 ml-1"
                                                    disabled={isCreating}
                                                    onClick={() => handleStartCheck(note.purchaseOrderId)}
                                                >
                                                    <ScanBarcode className="w-3.5 h-3.5" />
                                                    Tiếp tục
                                                </Button>
                                            )}

                                            {/* Nút xem chi tiết (chỉ icon mắt cho gọn) */}
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-500 hover:text-blue-600"
                                                onClick={() => handleViewDetail(note)}
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

                {/* Phân trang Control */}
                {!loading && pagination.totalItems > 0 && (
                    <div className="border-t bg-slate-50">
                        <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.onPageChange}
                            totalItems={pagination.totalItems}
                        />
                    </div>
                )}
            </div>

            {/* Dialog Detail (Giữ nguyên logic cũ, chỉ tinh chỉnh style) */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                            Chi tiết phiếu nhập: {selectedNote?.noteNumber}
                        </DialogTitle>
                        <DialogDescription>
                            PO: <span className="font-semibold text-foreground">{selectedNote?.poNumber}</span>
                            {' • '}
                            Người xử lý: {selectedNote?.processedBy || "N/A"}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="border rounded-md mt-2 max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[50px]">#</TableHead>
                                    <TableHead>Sản phẩm (ID)</TableHead>
                                    <TableHead className="text-right">SL Thực tế</TableHead>
                                    <TableHead>Ghi chú</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedNote?.inboundDetails?.map((detail, idx) => (
                                    <TableRow key={detail.id}>
                                        <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                                        <TableCell>
                                            <span className="font-medium">Sản phẩm #{detail.productId}</span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-blue-600">
                                            {detail.actualQty}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground italic text-sm">
                                            {detail.note || "-"}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Alert Dialog Delete (Giữ nguyên) */}
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