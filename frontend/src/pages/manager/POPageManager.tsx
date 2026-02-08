import { useState, useCallback } from "react";
import {
    Upload, FileSpreadsheet, Eye, Loader2, X, RefreshCw, Calendar, Package, User, Trash2, AlertCircle, RotateCcw, Filter, Plus
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POStatusBadge } from "@/components/inbound/POStatusBadge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { usePO } from "@/hooks/usePO";
import { PurchaseOrder } from "@/types/purchase-order.ts";
import { masterService } from "@/services/master.service";
import {PaginationControls} from "@/components/common/PaginationControls.tsx";

export default function POPageManager() {
    const {
        orders,
        pagination,
        suppliers,
        creators,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterSupplierId, setFilterSupplierId,
        filterCreator, setFilterCreator,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,
        isLoading,
        isUploading,
        handleUploadPO,
        refreshData,
        cancelPO,
        isCancelling,
    } = usePO();



    // --- UI States ---
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);

    // --- State cho Supplier ---
    const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
    const [isCreatingSupplier, setIsCreatingSupplier] = useState(false);
    const [newSupplier, setNewSupplier] = useState({
        name: "",
        phone: "",
        email: "",
        address: ""
    });

    // Upload logic states
    const [isDragging, setIsDragging] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

    // --- Helpers ---
    const formatDate = (dateString?: string) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
    };

    const handleViewDetail = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsViewDialogOpen(true);
    };

    // Drag & Drop
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

    const handleCancelClick = (e: React.MouseEvent, po: PurchaseOrder) => {
        e.stopPropagation();
        setPoToDelete(po);
    };

    const onConfirmCancel = () => {
        if (!poToDelete) return;
        cancelPO(poToDelete.id, () => {
            setPoToDelete(null);
        });
    };

    // Hàm tạo Supplier
    const handleCreateSupplier = async () => {
        if (!newSupplier.name) {
            toast({ title: "Thiếu thông tin", description: "Tên nhà cung cấp là bắt buộc", variant: "destructive" });
            return;
        }
        try {
            setIsCreatingSupplier(true);
            await masterService.createSupplier(newSupplier);
            toast({ title: "Thành công", description: "Đã thêm nhà cung cấp mới" });
            setNewSupplier({ name: "", phone: "", email: "", address: "" });
            setIsAddSupplierOpen(false);
            if (refreshData) await refreshData();
        } catch (error: any) {
            toast({
                title: "Lỗi",
                description: error?.response?.data?.details || "Tạo thất bại",
                variant: "destructive"
            });
        } finally {
            setIsCreatingSupplier(false);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý đơn đặt mua hàng"
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

            {/* --- FILTER BAR SECTION --- */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Filter className="w-4 h-4" /> Bộ lọc tìm kiếm
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    {/* ... Inputs filter ... */}
                    <div className="lg:col-span-2">
                        <Label className="text-xs mb-1.5 block">Từ khóa</Label>
                        <Input placeholder="Tìm mã PO..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-white"/>
                    </div>

                    {/* ... Filter Status ... */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Trạng thái</Label>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="NEW">Mới tạo</SelectItem>
                                <SelectItem value="APPROVED">Đã duyệt</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ... Filter Supplier ... */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Nhà cung cấp</Label>
                        <Select value={filterSupplierId} onValueChange={setFilterSupplierId}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {suppliers.map((s) => (<SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ... Filter Creator ... */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Người tạo</Label>
                        <Select value={filterCreator} onValueChange={setFilterCreator}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Tất cả" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {creators.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* ... Filter Date ... */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Ngày nhập</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal bg-white">
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {filterFromDate || filterToDate ? (
                                        <span className="truncate">
                                            {filterFromDate ? new Date(filterFromDate).toLocaleDateString('vi-VN') : ''}
                                            {(filterFromDate && filterToDate) ? ' - ' : ''}
                                            {filterToDate ? new Date(filterToDate).toLocaleDateString('vi-VN') : ''}
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
                <p>Hiển thị <strong>{orders.length}</strong> đơn hàng</p>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[160px]">Mã PO</TableHead>
                            <TableHead>Nhà cung cấp</TableHead>
                            <TableHead>Người tạo</TableHead> {/* Thêm cột người tạo nếu muốn hiển thị rõ */}
                            <TableHead className="w-[140px]">Trạng thái</TableHead>
                            <TableHead className="text-right">Tổng Items</TableHead>
                            <TableHead className="text-right">Tổng SL</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-[100px] text-right">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow><TableCell colSpan={8} className="h-32 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" /> Đang tải...</TableCell></TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">Không tìm thấy đơn hàng nào.</TableCell></TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow key={po.id} className="hover:bg-muted/30 cursor-pointer group" onClick={() => handleViewDetail(po)}>
                                    <TableCell><div className="flex items-center gap-2 font-medium text-slate-700"><FileSpreadsheet className="w-4 h-4 text-blue-500" /> {po.poNumber}</div></TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell className="text-sm text-slate-600">{po.createdByName || po.createdBy}</TableCell> {/* Hiển thị người tạo */}
                                    <TableCell><POStatusBadge status={po.status} /></TableCell>
                                    <TableCell className="text-right font-mono">{po.totalItems}</TableCell>
                                    <TableCell className="text-right font-mono font-semibold text-blue-600">{po.totalQuantity}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{formatDate(po.createdAt)}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end items-center gap-1 cursor-default" onClick={(e) => e.stopPropagation()}>
                                            {po.status === 'NEW' && (<Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-opacity" onClick={(e) => handleCancelClick(e, po)}><Trash2 className="w-4 h-4" /></Button>)}
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetail(po)}> <Eye className="w-4 h-4"/> </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
                {/* Phân Trang */}
                <div className="border-t bg-slate-50/50">
                    <PaginationControls
                        currentPage={pagination.currentPage}
                        totalPages={pagination.totalPages}
                        onPageChange={pagination.goToPage}
                        totalItems={pagination.totalItems}
                    />
                </div>
            </div>

            {/* --- Dialog Upload (Giữ nguyên) --- */}
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
                                <SelectContent>
                                    {suppliers.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50"
                                onClick={() => setIsAddSupplierOpen(true)}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Thêm nhà cung cấp mới
                            </Button>
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

            {/* --- Dialog Thêm Supplier (Giữ nguyên) --- */}
            <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Thêm Nhà cung cấp mới</DialogTitle>
                        <DialogDescription>
                            Tạo nhanh thông tin NCC để tiếp tục nhập hàng.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="s-name" className="text-right">Tên NCC <span className="text-red-500">*</span></Label>
                            <Input id="s-name" className="col-span-3" placeholder="VD: Công ty TNHH ABC" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="s-phone" className="text-right">SĐT</Label>
                            <Input id="s-phone" className="col-span-3" placeholder="09xxxx..." value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="s-email" className="text-right">Email</Label>
                            <Input id="s-email" type="email" className="col-span-3" placeholder="contact@company.com" value={newSupplier.email} onChange={(e) => setNewSupplier({...newSupplier, email: e.target.value})}/>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="s-address" className="text-right">Địa chỉ</Label>
                            <Input id="s-address" className="col-span-3" placeholder="Số nhà, đường..." value={newSupplier.address} onChange={(e) => setNewSupplier({...newSupplier, address: e.target.value})}/>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)} disabled={isCreatingSupplier}>Hủy</Button>
                        <Button onClick={handleCreateSupplier} disabled={isCreatingSupplier}>
                            {isCreatingSupplier && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Lưu thông tin
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Dialog Chi tiết (Giữ nguyên) --- */}
            <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
                <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            <Package className="w-5 h-5 text-blue-600" />
                            Chi tiết Đơn hàng: {selectedPO?.poNumber}
                        </DialogTitle>
                        <DialogDescription>Thông tin chi tiết được tải sẵn.</DialogDescription>
                    </DialogHeader>
                    {selectedPO ? (
                        <div className="flex-1 overflow-hidden flex flex-col gap-4 min-h-0">
                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border text-sm">
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Nhà cung cấp</span>
                                    <span className="font-medium text-slate-800">{selectedPO.supplierName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Người tạo</span>
                                    <span className="font-medium text-slate-800 flex items-center gap-1"><User className="w-3 h-3" /> {selectedPO.createdByName}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Ngày dự kiến</span>
                                    <span className="font-medium text-slate-800 flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(selectedPO.expectedDate)}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground text-xs uppercase font-semibold block">Tổng quan</span>
                                    <span className="font-mono font-bold text-blue-700">{selectedPO.totalQuantity} items</span>
                                </div>
                            </div>
                            <div className="flex-1 border rounded-md overflow-hidden flex flex-col">
                                <div className="bg-muted/50 px-4 py-2 border-b text-xs font-semibold uppercase text-muted-foreground flex justify-between"><span>Sản phẩm</span><span>Số lượng đặt</span></div>
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
                                                    <div className="font-mono font-bold text-slate-900 text-base">{item.expectedQty}</div>
                                                </div>
                                            ))
                                        ) : (<div className="p-8 text-center text-muted-foreground text-sm">Không có sản phẩm nào.</div>)}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    ) : (<div className="py-8 text-center text-muted-foreground">Chưa chọn đơn hàng.</div>)}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- Alert Cancel (Giữ nguyên) --- */}
            <AlertDialog open={!!poToDelete} onOpenChange={(open) => !open && !isCancelling && setPoToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-red-600"><AlertCircle className="w-5 h-5" /> Xác nhận hủy đơn hàng</AlertDialogTitle>
                        <AlertDialogDescription>Bạn có chắc chắn muốn hủy đơn hàng <strong>{poToDelete?.poNumber}</strong> không?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isCancelling}>Thoát</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.preventDefault(); onConfirmCancel(); }} className="bg-red-600 hover:bg-red-700 text-white" disabled={isCancelling}>
                            {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            {isCancelling ? "Đang hủy..." : "Xác nhận hủy"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}