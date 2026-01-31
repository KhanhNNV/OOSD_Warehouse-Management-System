import { useState } from "react";
import {
    Search, Filter, AlertTriangle, ScanBarcode, Eye, Package, RotateCcw, Calendar, Loader2
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { POStatusBadge } from "@/components/inbound/POStatusBadge.tsx";
import { usePoForStaff } from "@/hooks/usePoForStaff.ts";
import { cn } from "@/lib/utils.ts";
import { PurchaseOrder } from "@/types/poForStaff.ts";
import { PaginationControls } from "@/components/common/PaginationControls";

export default function PurchaseOrderPage() {
    const {
        orders,
        uniqueSuppliers,
        uniqueCreators,
        isLoading,

        // Filter States
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterSupplier, setFilterSupplier,
        filterCreator, setFilterCreator,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,

        // Pagination & Actions
        pagination,
        handleStartCheck,
        isCreating
    } = usePoForStaff();

    const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);

    const handleViewDetail = (po: PurchaseOrder) => {
        setSelectedPO(po);
        setIsDetailOpen(true);
    };

    return (
        <div className="animate-fade-in space-y-6 pb-10">
            <PageHeader
                title="Quản lý Nhập kho (Inbound)"
                description="Theo dõi đơn mua hàng (PO) và tiến độ nhận hàng từ Nhà Cung Cấp."
            />

            {/* --- FILTER BAR --- */}
            <div className="bg-white p-4 rounded-lg border shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-semibold text-slate-700">
                        <Filter className="w-4 h-4" /> Bộ lọc tìm kiếm
                    </div>
                    <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-red-500">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset
                    </Button>
                </div>

                {/* Chỉnh grid lên 6 cột để vừa vặn */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">

                    {/* 1. Search */}
                    <div className="lg:col-span-1">
                        <Label className="text-xs mb-1.5 block">Từ khóa</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Mã PO..."
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
                                <SelectItem value="NEW">Mới tạo</SelectItem>
                                <SelectItem value="PROCESSING">Đang xử lý</SelectItem>
                                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Supplier */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Nhà cung cấp</Label>
                        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn NCC" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {uniqueSuppliers.map((sup) => (
                                    <SelectItem key={sup} value={sup}>{sup}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Creator  */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Người tạo</Label>
                        <Select value={filterCreator} onValueChange={setFilterCreator}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn người tạo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                {uniqueCreators.map((creator) => (
                                    <SelectItem key={creator} value={creator}>{creator}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 5. Date Range */}
                    <div className="lg:col-span-2">
                        <Label className="text-xs mb-1.5 block">Ngày tạo</Label>
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

            {/* Main Table */}
            <div className="bg-card rounded-xl border overflow-hidden flex flex-col">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã PO</TableHead>
                            <TableHead>Nhà cung cấp</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Người tạo</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="w-[100px] text-center">Hành động</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Không tìm thấy đơn mua hàng nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow
                                    key={po.id}
                                    className={cn(
                                        "hover:bg-muted/50 transition-colors",
                                        po.hasVariance && "bg-yellow-50/50"
                                    )}
                                >
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{po.poNumber}</span>
                                            {po.hasVariance && (
                                                <AlertTriangle className="w-4 h-4 text-yellow-600"/>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell>
                                        <POStatusBadge status={po.status} />
                                    </TableCell>
                                    {/* Hiển thị tên người tạo */}
                                    <TableCell className="font-medium text-green-700">
                                        {po.createdByName || "N/A"}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {po.createdAt
                                            ? new Date(po.createdAt).toLocaleDateString("vi-VN")
                                            : "-"}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {po.status === "NEW" && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-blue-600 hover:bg-blue-50 border-blue-200"
                                                    disabled={isCreating}
                                                    onClick={() => handleStartCheck(po.id)}
                                                >
                                                    {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <ScanBarcode className="w-4 h-4 mr-2" />}
                                                    Tạo phiếu
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleViewDetail(po)}
                                                title="Xem danh sách sản phẩm"
                                                className="hover:bg-blue-50 text-blue-600"
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

                {/* Phân trang */}
                {!isLoading && pagination.totalItems > 0 && (
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

            {/* Dialog Detail */}
            <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Package className="w-5 h-5 text-blue-600"/>
                            Chi tiết đơn hàng: {selectedPO?.poNumber}
                        </DialogTitle>
                        <DialogDescription>
                            NCC: <span className="font-semibold text-foreground">{selectedPO?.supplierName}</span>
                            {' • '}
                            Người tạo: <span className="font-semibold text-foreground">{selectedPO?.createdByName}</span>
                            <br/>
                            Tổng: {selectedPO?.totalItems} loại sản phẩm
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow>
                                    <TableHead className="w-[50px]">STT</TableHead>
                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead>SKU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedPO?.details?.map((item, idx) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="text-center">{idx + 1}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{item.productName}</div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {item.productSku}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}