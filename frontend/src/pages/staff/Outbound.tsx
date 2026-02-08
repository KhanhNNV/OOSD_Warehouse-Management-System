import { Package, Truck, Search, Filter, Eye, User, Loader2, RotateCcw, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useOutbound } from "@/hooks/useOutbound";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "@/hooks/useMasterData";
import { CreateOrderDialog } from "@/components/outbound/CreateOrderDialog";
import { OutboundStatusBadge } from "@/components/outbound/OutboundStatusBadge";
import { outboundService } from "@/services/outbound.service";
import { useToast } from "@/hooks/use-toast";
import { authUtils } from "@/utils/auth.ts";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {PaginationControls} from "@/components/common/PaginationControls.tsx";

export default function OutboundPage() {
    const {
        orders,
        stats,
        uniquePickers,
        searchTerm, setSearchTerm,
        filterStatus, setFilterStatus,
        filterPicker, setFilterPicker,
        filterFromDate, setFilterFromDate,
        filterToDate, setFilterToDate,
        resetFilters,
        refetch,
        isLoading,
        pagination
    } = useOutbound();

    const navigate = useNavigate();
    const { toast } = useToast();
    const { products } = useMasterData();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);

    // ... (Giữ nguyên các hàm handleViewPickingInstruction, handleRegisterAndStart) ...
    const handleViewPickingInstruction = (orderId: number) => {
        const user = authUtils.getCurrentUser();
        if(!user){ navigate("/login"); return; }
        const basePath = authUtils.getRoleHomePath(user.role);
        navigate(`${basePath}/picking-instruction/${orderId}`);
    };

    const handleRegisterAndStart = async (orderId: number, orderNumber: string) => {
        if (processingId) return;
        setProcessingId(orderId);
        try {
            await outboundService.registerPicking(orderId);
            toast({
                title: "Nhận đơn thành công!",
                description: `Đang tạo lộ trình lấy hàng cho đơn ${orderNumber}...`,
                className: "bg-green-600 text-white border-none",
            });
            handleViewPickingInstruction(orderId);
        } catch (error: any) {
            toast({
                title: "Lỗi nhận đơn",
                description: error.response?.data?.message || "Không thể tạo phiếu xuất kho.",
                variant: "destructive",
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Xuất kho (Outbound)"
                description="Quy trình: Nhận đơn (Xe tải) -> Quét kệ & Lấy hàng -> Hoàn tất."
            />

            {/* Stats Cards (Giữ nguyên) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Đơn mới (Cần xử lý)", count: stats.new, color: "text-slate-600", icon: Package },
                    { label: "Đang lấy hàng", count: stats.processing, color: "text-blue-600", icon: Package },
                    { label: "Đã hoàn thành", count: stats.shipped, color: "text-green-600", icon: Truck },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-lg border p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{stat.label}</p>
                                <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.count}</p>
                            </div>
                            <stat.icon className={cn("w-8 h-8", stat.color)} />
                        </div>
                    </div>
                ))}
            </div>

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

                {/* Grid layout cho bộ lọc: Giờ là 5 items nên chia layout lại */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 1. Search (Chiếm 2 cột trên màn hình lớn nếu muốn, ở đây để 1 cột) */}
                    <div className="lg:col-span-1">
                        <Label className="text-xs mb-1.5 block">Từ khóa</Label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Mã đơn, SĐT..."
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
                                <SelectItem value="ALLOCATED">Đã phân kho</SelectItem>
                                <SelectItem value="PICKING">Đang lấy hàng</SelectItem>
                                <SelectItem value="PACKED">Đã đóng gói</SelectItem>
                                <SelectItem value="SHIPPED">Đã xuất kho</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 3. Picker (MỚI THÊM) */}
                    <div>
                        <Label className="text-xs mb-1.5 block">Người phụ trách</Label>
                        <Select value={filterPicker} onValueChange={setFilterPicker}>
                            <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Chọn nhân viên" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả</SelectItem>
                                <SelectItem value="unassigned" className="text-muted-foreground font-medium italic">-- Chưa phân công --</SelectItem>
                                {/* Render danh sách nhân viên có trong đơn hàng */}
                                {uniquePickers.map((name) => (
                                    <SelectItem key={name} value={name}>
                                        {name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* 4. Date Range (Chiếm 2 cột) */}
                    <div className="lg:col-span-2">
                        <Label className="text-xs mb-1.5 block">Ngày tạo đơn</Label>
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

            {/* Table (Giữ nguyên, chỉ kiểm tra lại cột Người phụ trách) */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã đơn</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Người phụ trách</TableHead>
                            <TableHead>Ngày tạo</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                            <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {isLoading && orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Đang tải dữ liệu...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Không tìm thấy đơn hàng nào phù hợp</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const isMine = order.isAssignedToCurrentUser;
                                const isProcessingThis = processingId === order.id;

                                return (
                                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{order.customerName || order.toName}</div>
                                            {order.toPhone && <div className="text-xs text-muted-foreground">{order.toPhone}</div>}
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate" title={order.toAddress}>{order.toAddress}</TableCell>
                                        <TableCell>
                                            <OutboundStatusBadge status={order.status} />
                                        </TableCell>

                                        {/* CỘT NGƯỜI PHỤ TRÁCH */}
                                        <TableCell>
                                            {order.assignedPickerName ? (
                                                <span className={cn("text-sm font-medium", isMine ? "text-blue-700" : "text-slate-700")}>
                                                    {order.assignedPickerName} {isMine && "(Tôi)"}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">--</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-sm text-slate-500">
                                            {order.createdDate ? new Date(order.createdDate).toLocaleDateString('vi-VN') : "-"}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">{order.totalQuantity}</TableCell>

                                        {/* THAO TÁC */}
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">
                                                {(order.status === "NEW" || order.status === "ALLOCATED") && !order.assignedPickerName && (
                                                    <Button
                                                        size="sm"
                                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm transition-all"
                                                        onClick={() => handleRegisterAndStart(order.id, order.orderNumber)}
                                                        disabled={isProcessingThis}
                                                    >
                                                        {isProcessingThis ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                                                        Nhận đơn
                                                    </Button>
                                                )}
                                                {order.status === "PICKING" && isMine && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-blue-600 border-blue-200 hover:bg-blue-50 gap-2"
                                                        onClick={() => handleViewPickingInstruction(order.id)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        Soạn tiếp
                                                    </Button>
                                                )}
                                                {order.status === "PICKING" && !isMine && (
                                                    <Button size="sm" variant="ghost" disabled className="opacity-50">
                                                        <User className="w-4 h-4 mr-2" /> Bận
                                                    </Button>
                                                )}
                                                {(order.status === "PACKED" || order.status === "SHIPPED") && (
                                                    <span className="text-xs text-green-600 font-medium border border-green-200 bg-green-50 px-2 py-1 rounded">Hoàn tất</span>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                {/* --- PHÂN TRANG CONTROL --- */}
                {!isLoading && pagination.totalItems > 0 && (
                    <div className="border-t bg-slate-50">
                        <PaginationControls
                            currentPage={pagination.currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={pagination.goToPage}
                            totalItems={pagination.totalItems}
                        />
                    </div>
                )}
            </div>
            {/* Dialog Create Order */}
            <CreateOrderDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={refetch}
                products={products}
            />
        </div>
    );
}