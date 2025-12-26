import { Search, Filter, Package, ArrowUpDown, AlertTriangle, CheckCircle2, Box } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useInventory } from "@/hooks/useInventory"; // Import Hook

export default function InventoryPage() {
    const { inventory, stats, searchTerm, setSearchTerm, handleSort, sortConfig } = useInventory();

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Tồn kho"
                description="Theo dõi số lượng hàng hóa thực tế và khả dụng trong kho."
            />

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: "Tổng tồn kho (Thực tế)",
                        value: stats.totalPhysical,
                        icon: Box,
                        color: "text-primary",
                        bg: "bg-primary/10"
                    },
                    {
                        label: "Đã phân bổ (Đang giữ)",
                        value: stats.totalAllocated,
                        icon: Package,
                        color: "text-blue-600",
                        bg: "bg-blue-50"
                    },
                    {
                        label: "Có thể bán (Available)",
                        value: stats.totalAvailable,
                        icon: CheckCircle2,
                        color: "text-green-600",
                        bg: "bg-green-50"
                    },
                    {
                        label: "Cảnh báo (Sắp/Hết hàng)",
                        value: stats.lowStockCount + stats.outOfStockCount,
                        icon: AlertTriangle,
                        color: "text-orange-600",
                        bg: "bg-orange-50"
                    },
                ].map((stat, index) => (
                    <div key={index} className="bg-card rounded-lg border p-4 shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className={cn("p-3 rounded-lg", stat.bg)}>
                                <stat.icon className={cn("w-6 h-6", stat.color)} />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                                <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo tên sản phẩm, SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Bộ lọc nâng cao
                </Button>
            </div>

            {/* Inventory Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead className="w-[300px]">Sản phẩm</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Vị trí</TableHead>
                            {/* Cột Sortable: SL Thực tế */}
                            <TableHead className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleSort("physical")} className="-mr-3 font-semibold hover:bg-transparent">
                                    SL Thực tế
                                    <ArrowUpDown className={cn("ml-2 w-3 h-3", sortConfig.field === 'physical' ? "text-primary" : "text-muted-foreground")} />
                                </Button>
                            </TableHead>
                            <TableHead className="text-right">Đã phân bổ</TableHead>
                            {/* Cột Sortable: Có thể xuất */}
                            <TableHead className="text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleSort("available")} className="-mr-3 font-semibold hover:bg-transparent">
                                    Có thể xuất
                                    <ArrowUpDown className={cn("ml-2 w-3 h-3", sortConfig.field === 'available' ? "text-primary" : "text-muted-foreground")} />
                                </Button>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inventory.map((item) => (
                            <TableRow
                                key={item.id}
                                className={cn(
                                    "transition-colors",
                                    item.availableQty === 0 ? "bg-red-50/50 hover:bg-red-50" : "hover:bg-muted/50"
                                )}
                            >
                                <TableCell className="font-medium">{item.productName}</TableCell>
                                <TableCell className="font-mono text-xs text-muted-foreground">{item.sku}</TableCell>
                                <TableCell>
                  <span className="inline-flex items-center px-2 py-1 rounded border bg-background text-xs font-medium">
                    {item.location}
                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium text-slate-600">{item.physicalQty}</TableCell>
                                <TableCell className="text-right text-slate-500">{item.allocatedQty}</TableCell>
                                <TableCell className="text-right">
                                    {/* Logic hiển thị màu sắc số lượng */}
                                    <span
                                        className={cn(
                                            "font-bold",
                                            item.availableQty === 0 && "text-red-600",
                                            item.availableQty > 0 && item.availableQty <= 10 && "text-orange-600",
                                            item.availableQty > 10 && "text-green-600"
                                        )}
                                    >
                    {item.availableQty}
                  </span>
                                </TableCell>
                            </TableRow>
                        ))}
                        {inventory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                    Không tìm thấy sản phẩm nào.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer / Legend */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span>Hết hàng (0)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span>Sắp hết (≤10)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span>Sẵn sàng ({">"}10)</span>
                </div>
            </div>
        </div>
    );
}