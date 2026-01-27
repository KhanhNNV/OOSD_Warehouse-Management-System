import { Package, Truck, Search, Filter, Eye, User, Loader2 } from "lucide-react"; // Thêm Loader2
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useOutbound } from "@/hooks/useOutbound";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMasterData } from "@/hooks/useMasterData";
import { CreateOrderDialog } from "@/components/outbound/CreateOrderDialog";
import { OutboundStatusBadge } from "@/components/outbound/OutboundStatusBadge";
import { outboundService } from "@/services/outbound.service"; // Import Service
import { useToast } from "@/hooks/use-toast"; // Import Toast

export default function OutboundPage() {
    const { orders, stats, searchTerm, setSearchTerm, refetch } = useOutbound();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { products } = useMasterData();
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // State để hiển thị loading xoay vòng trên nút đang bấm
    const [processingId, setProcessingId] = useState<number | null>(null);

    // --- HÀM 1: CHUYỂN HƯỚNG SANG TRANG GỢI Ý (INSTRUCTION) ---
    const handleViewPickingInstruction = (orderId: number) => {
        // Chuyển hướng nội bộ (SPA) thay vì mở tab mới để giữ context
        navigate(`/staff/picking-instruction/${orderId}`);
    };

    // --- HÀM 2: LOGIC NHẤN XE TẢI -> TẠO NOTE -> CHUYỂN HƯỚNG ---
    const handleRegisterAndStart = async (orderId: number, orderNumber: string) => {
        if (processingId) return; // Chặn double click
        setProcessingId(orderId);

        try {
            // 1. Gọi API Backend: Tạo OutboundNote & Update Status
            await outboundService.registerPicking(orderId);

            toast({
                title: "Nhận đơn thành công!",
                description: `Đang tạo lộ trình lấy hàng cho đơn ${orderNumber}...`,
                className: "bg-green-600 text-white border-none",
            });

            // 2. Sau khi API xong -> Chuyển hướng sang trang hướng dẫn
            handleViewPickingInstruction(orderId);

        } catch (error) {
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

            {/* Stats Cards */}
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

            {/* Toolbar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm mã đơn, khách hàng..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" /> Bộ lọc
                </Button>
            </div>

            {/* Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã đơn</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Địa chỉ</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Người phụ trách</TableHead>
                            <TableHead>Ngày xuất</TableHead>
                            <TableHead className="text-right">SL</TableHead>
                            <TableHead className="text-center">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>

                    <TableBody>
                        {orders.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    <p>Chưa có đơn hàng nào</p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((order) => {
                                const isMine = order.isAssignedToCurrentUser;
                                // Kiểm tra xem đơn này có đang được xử lý API không
                                const isProcessingThis = processingId === order.id;

                                return (
                                    <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                        <TableCell className="font-medium">{order.orderNumber}</TableCell>

                                        <TableCell>
                                            <div className="font-medium">{order.customerName || order.toName}</div>
                                            {order.toPhone && <div className="text-xs text-muted-foreground">{order.toPhone}</div>}
                                        </TableCell>

                                        <TableCell className="max-w-[200px] truncate">{order.toAddress}</TableCell>

                                        <TableCell>
                                            <OutboundStatusBadge status={order.status} />
                                        </TableCell>

                                        <TableCell>
                                            {order.assignedPickerName ? (
                                                <span className={cn("text-sm font-medium", isMine ? "text-blue-700" : "text-slate-700")}>
                                                    {order.assignedPickerName}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-slate-400 italic">--</span>
                                            )}
                                        </TableCell>

                                        <TableCell className="text-sm text-slate-500">
                                            {order.exportedDate ? new Date(order.exportedDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : "-"}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <span className="font-semibold">{order.totalQuantity}</span>
                                        </TableCell>

                                        {/* === CỘT THAO TÁC (QUAN TRỌNG) === */}
                                        <TableCell>
                                            <div className="flex items-center justify-center gap-2">

                                                {/* 1. NÚT XE TẢI (NHẬN ĐƠN) - Cho đơn Mới/Allocated chưa ai nhận */}
                                                {(order.status === "NEW" || order.status === "ALLOCATED") && !order.assignedPickerName && (
                                                    <Button
                                                        size="sm"
                                                        // Style màu xanh nổi bật
                                                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm transition-all"
                                                        onClick={() => handleRegisterAndStart(order.id, order.orderNumber)}
                                                        disabled={isProcessingThis}
                                                    >
                                                        {isProcessingThis ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Truck className="w-4 h-4" />
                                                        )}
                                                        Nhận đơn
                                                    </Button>
                                                )}

                                                {/* 2. NÚT TIẾP TỤC (MẮT) - Cho đơn đang Picking của chính mình */}
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

                                                {/* 3. TRẠNG THÁI KHÁC - Disabled hoặc chỉ xem */}
                                                {order.status === "PICKING" && !isMine && (
                                                    <Button size="sm" variant="ghost" disabled className="opacity-50">
                                                        <User className="w-4 h-4 mr-2" /> Bận
                                                    </Button>
                                                )}

                                                {/* 4. Đơn đã xong */}
                                                {(order.status === "PACKED" || order.status === "SHIPPED") && (
                                                    <span className="text-xs text-green-600 font-medium">Hoàn tất</span>
                                                )}

                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateOrderDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={refetch}
                products={products}
            />
        </div>
    );
}