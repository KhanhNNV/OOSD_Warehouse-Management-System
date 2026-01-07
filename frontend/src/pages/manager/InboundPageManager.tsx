import { useState, useCallback } from "react";
import {
    Upload, FileSpreadsheet, Search, Eye, Loader2, X, RefreshCw, Calendar, Package, User
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POStatusBadge } from "@/components/inbound/POStatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Import Hook và Type
import { usePO } from "@/hooks/usePO";
import { PurchaseOrder } from "@/types/purchase-order.ts";

export default function InboundPageManager() {
    const {
        orders,
        suppliers,
        searchTerm,
        setSearchTerm,
        isLoading,
        isUploading,
        handleUploadPO,
        refreshData
    } = usePO();

    // --- UI States ---
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

    // State chứa PO đang được chọn để xem (Lấy trực tiếp từ list, ko cần fetch lại)
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

    const [isDragging, setIsDragging] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

    // --- Helper Format Date ---
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
        });
    };

    // --- Handler: Bấm nút Mắt để xem chi tiết ---
    const handleViewDetail = (po: PurchaseOrder) => {
        // Dữ liệu details đã có sẵn trong object po, chỉ cần set state và mở modal
        setSelectedPO(po);
        setIsViewDialogOpen(true);
    };

    // --- Drag & Drop Logic (Giữ nguyên để code gọn, tôi chỉ note lại) ---
    const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); if (!isUploading) setIsDragging(true); }, [isUploading]);
    const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (isUploading) return;
        if (e.dataTransfer.files?.length > 0) validateAndSetFile(e.dataTransfer.files[0]);
    }, [isUploading]);

    const validateAndSetFile = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            toast({ title: "Lỗi", description: "File không hợp lệ (.xlsx, .xls)", variant: "destructive" }); return;
        }
        setUploadFile(file);
    };

    const onSubmitUpload = () => {
        if (!uploadFile || !selectedSupplierId) return;
        handleUploadPO(uploadFile, selectedSupplierId, () => {
            setIsUploadDialogOpen(false); setUploadFile(null); setSelectedSupplierId("");
        });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Nhập kho (Manager)"
                description="Quản lý Purchase Orders và chi tiết hàng hóa."
                action={
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => refreshData && refreshData()}>
                            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                        </Button>
                        <Button onClick={() => setIsUploadDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                            <Upload className="w-4 h-4 mr-2" /> Tạo PO từ Excel
                        </Button>
                    </div>
                }
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

            {/* Table */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[160px]">Mã PO</TableHead>
                            <TableHead>Nhà cung cấp</TableHead>
                            <TableHead className="w-[140px]">Trạng thái</TableHead>
                            <TableHead className="text-right">Tổng Items</TableHead>
                            <TableHead className="text-right">Tổng SL</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={7} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /> Đang tải...</TableCell></TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow><TableCell colSpan={7} className="h-32 text-center text-muted-foreground">Không có dữ liệu.</TableCell></TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow key={po.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleViewDetail(po)}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 font-medium text-slate-700">
                                            <FileSpreadsheet className="w-4 h-4 text-blue-500" /> {po.poNumber}
                                        </div>
                                    </TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell><POStatusBadge status={po.status} /></TableCell>
                                    <TableCell className="text-right font-mono">{po.totalItems}</TableCell>
                                    {/* Hiển thị Total Quantity mới có trong JSON */}
                                    <TableCell className="text-right font-mono font-semibold text-blue-600">
                                        {po.totalQuantity}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{formatDate(po.createdAt)}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-600">
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- Dialog Upload (Giữ nguyên UI) --- */}
            <Dialog open={isUploadDialogOpen} onOpenChange={(open) => !isUploading && setIsUploadDialogOpen(open)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Tạo phiếu nhập từ Excel</DialogTitle>
                        <DialogDescription>Tải lên file .xlsx chứa danh sách SKU và số lượng.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nhà cung cấp <span className="text-red-500">*</span></Label>
                            <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId} disabled={isUploading}>
                                <SelectTrigger><SelectValue placeholder="-- Chọn Nhà cung cấp --" /></SelectTrigger>
                                <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div
                            className={cn("border-2 border-dashed rounded-xl p-6 text-center cursor-pointer", isDragging ? "border-blue-500 bg-blue-50" : "border-slate-200", uploadFile && "border-green-500 bg-green-50/30")}
                            onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                            onClick={() => !uploadFile && !isUploading && document.getElementById("hidden-file-input")?.click()}
                        >
                            <input type="file" id="hidden-file-input" className="hidden" accept=".xlsx,.xls" onChange={(e) => e.target.files?.[0] && validateAndSetFile(e.target.files[0])} disabled={isUploading} />
                            {!uploadFile ? (
                                <div className="text-slate-500"><FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50"/>Kéo thả hoặc click chọn file</div>
                            ) : (
                                <div className="flex items-center justify-between bg-white p-2 rounded border"><span className="text-sm font-medium">{uploadFile.name}</span> <X className="w-4 h-4 cursor-pointer hover:text-red-500" onClick={(e) => {e.stopPropagation(); setUploadFile(null)}}/></div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>Đóng</Button>
                        <Button onClick={onSubmitUpload} disabled={!uploadFile || !selectedSupplierId || isUploading} className="bg-blue-600">
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tạo đơn nhập"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- DIALOG CHI TIẾT (Đã cập nhật) --- */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                            Chi tiết Đơn hàng: {selectedPO?.poNumber}
                        </DialogTitle>
                        <DialogDescription>
                            Thông tin chi tiết được tải sẵn.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedPO ? (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                            {/* Header Info */}
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border text-sm">
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Nhà cung cấp</span>
                                    <span className="font-medium text-slate-800">{selectedPO.supplierName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Người tạo</span>
                                    <span className="font-medium text-slate-800 flex items-center gap-1">
                                        <User className="w-3 h-3" /> {selectedPO.createdByName}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Ngày dự kiến</span>
                                    <span className="font-medium text-slate-800 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" /> {formatDate(selectedPO.expectedDate)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Tổng quan</span>
                                    <span className="font-mono font-bold text-blue-700">
                                        {selectedPO.totalQuantity} items
                                    </span>
                                </div>
                            </div>

                            {/* List Details (Render trực tiếp từ selectedPO.details) */}
                            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                                    <span>Sản phẩm</span>
                                    <span>Số lượng đặt</span>
                                </div>
                                <ScrollArea className="flex-1 h-full w-full">
                                    <div className="flex flex-col">
                                        {selectedPO.details && selectedPO.details.length > 0 ? (
                                            selectedPO.details.map((item) => (
                                                <div key={item.id} className="flex justify-between items-center px-4 py-3 border-b last:border-0 hover:bg-slate-50 text-sm">
                                                    <div>
                                                        <div className="font-medium text-slate-800">{item.productName}</div>
                                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                            <span className="bg-slate-100 px-1 rounded border">{item.productSku}</span>
                                                        </div>
                                                    </div>
                                                    <div className="font-mono font-bold text-slate-900 text-base">
                                                        {item.expectedQty}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="p-8 text-center text-muted-foreground text-sm">
                                                Không có sản phẩm nào trong đơn hàng này.
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">Chưa chọn đơn hàng.</div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}