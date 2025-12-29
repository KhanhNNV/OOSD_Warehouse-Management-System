import { Plus, Search, Filter, Eye, Package } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { SOStatusBadge } from "@/components/outbound/SOStatusBadge"; // Badge riêng
import { useOutbound } from "@/hooks/useOutbound";
import { cn } from "@/lib/utils";

export default function OutboundPage() {
    const { orders, stats, searchTerm, setSearchTerm } = useOutbound();

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Xuất kho (Outbound)"
                description="Xử lý đơn hàng: Giữ chỗ (Allocated) -> Nhặt (Picking) -> Đóng gói (Packed)."
                action={
                    <Button>
                        <Plus className="w-4 h-4 mr-2" /> Tạo đơn xuất
                    </Button>
                }
            />

            {/* Stats Cards - Hiển thị tổng quan quy trình */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                    { label: "Đơn mới (Cần duyệt)", count: stats.new, color: "text-slate-600" },
                    { label: "Đang xử lý trong kho", count: stats.processing, color: "text-blue-600" }, // Allocated + Picking + Packed
                    { label: "Đã giao đi", count: stats.shipped, color: "text-green-600" },
                ].map((stat) => (
                    <div key={stat.label} className="bg-card rounded-lg border p-4 shadow-sm">
                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                        <p className={cn("text-2xl font-bold mt-1", stat.color)}>{stat.count}</p>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm mã đơn, khách hàng..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Bộ lọc</Button>
            </div>

            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã đơn</TableHead>
                            <TableHead>Khách hàng</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead>Tiến độ xử lý</TableHead>
                            <TableHead className="text-right">Số lượng</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => {
                            // Tính % hoàn thành dựa trên số lượng đã phân bổ (Allocated)
                            const percent = Math.round((order.allocatedItems / order.totalItems) * 100) || 0;

                            return (
                                <TableRow key={order.id} className="hover:bg-muted/50 transition-colors">
                                    <TableCell className="font-medium">{order.orderNumber}</TableCell>
                                    <TableCell>{order.customerName}</TableCell>
                                    <TableCell>
                                        {/* Sử dụng Badge chuyên biệt của Outbound */}
                                        <SOStatusBadge status={order.status} />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3 max-w-[140px]">
                                            <Progress value={percent} className="h-2" />
                                            <span className="text-xs text-muted-foreground w-8">{percent}%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Package className="w-4 h-4 text-muted-foreground" />
                                            <span>{order.totalItems}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}