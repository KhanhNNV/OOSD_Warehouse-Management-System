import { useState } from "react";
import {
    FileText,
    RefreshCw,
    Package,
    Calendar,
    Hash,
    RotateCcw, Eye, ScanBarcode
} from "lucide-react";

// Các UI components (giả định đường dẫn giống dự án của bạn)
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge"; // Dùng Badge của Shadcn
import { cn } from "@/lib/utils";

// Hook và Type
import { useMyInboundNotes } from "@/hooks/useInbound";
import { InboundNoteResponse, InboundStatus } from "@/types/inbound";

// --- Helper Component: Status Badge ---
const InboundStatusBadge = ({ status }: { status: InboundStatus }) => {
    const styles: Record<InboundStatus, string> = {
        DRAFT: "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
        VERIFIED: "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
        COMPLETED: "bg-green-100 text-green-800 border-green-200 hover:bg-green-100",
        CANCELLED: "bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100",
        FAILED: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
    };

    const labels: Record<InboundStatus, string> = {
        DRAFT: "Nháp",
        VERIFIED: "Đã kiểm",
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
    // 1. Lấy dữ liệu từ Hook
    const { data, loading, refetch,handleStartCheck, isCreating } = useMyInboundNotes();

    const [selectedNote, setSelectedNote] = useState<InboundNoteResponse | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleViewDetail = (note: InboundNoteResponse) => {
        setSelectedNote(note);
        setIsDetailOpen(true);
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Lịch sử nhập kho của tôi"
                description="Danh sách các phiếu nhập kho (Inbound Note) bạn đã thực hiện."
            />

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    variant="outline"
                    onClick={refetch}
                    disabled={loading}
                    className="gap-2"
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
                            <TableHead className="text-center">Lần thử</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="w-[100px] text-center">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading && data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    Đang tải dữ liệu...
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Bạn chưa thực hiện phiếu nhập nào.
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
                                    <TableCell className="text-center">
                                        <div className="inline-flex items-center gap-1 text-xs font-medium bg-gray-100 px-2 py-1 rounded-full text-gray-600">
                                            <RotateCcw className="w-3 h-3" />
                                            {note.retryCount}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <InboundStatusBadge status={note.status} />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-blue-600 hover:bg-blue-50 border-blue-200"
                                                disabled={
                                                    note.status !== "DRAFT" &&
                                                    note.status !== "CANCELLED" ||
                                                    isCreating // Disable khi đang gọi API
                                                }
                                                onClick={() => handleStartCheck(note.purchaseOrderId)}
                                            >
                                                <ScanBarcode className="w-4 h-4 mr-2" />
                                                {/* Có thể thêm icon spinner loading nếu isCreating === true */}
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

            {/* Dialog Detail */}
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

                    {/* Detail Table inside Dialog */}
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
        </div>
    );
}