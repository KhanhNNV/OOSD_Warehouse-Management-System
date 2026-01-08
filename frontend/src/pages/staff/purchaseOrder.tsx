import { useState } from "react";
// Bỏ import useNavigate ở đây vì đã xử lý trong hook
import {
    Search,
    Filter,
    AlertTriangle,
    ScanBarcode,
    Eye,
    Package,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table.tsx";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog.tsx";
import { POStatusBadge } from "@/components/inbound/POStatusBadge.tsx";
import { usePoForStaff } from "@/hooks/usePoForStaff.ts";
import { cn } from "@/lib/utils.ts";
import { PurchaseOrder } from "@/types/poForStaff.ts";
import { PaginationControls } from "@/components/common/PaginationControls";

export default function PurchaseOrderPage() {
    // 1. Lấy handleStartCheck và isCreating từ hook
    const {
        orders,
        searchTerm,
        setSearchTerm,
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
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Nhập kho (Inbound)"
                description="Theo dõi đơn mua hàng (PO) và tiến độ nhận hàng từ NCC."
            />

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo PO, Nhà cung cấp..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" /> Bộ lọc
                </Button>
            </div>

            {/* Main Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
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
                        {orders.map((po) => (
                            <TableRow
                                key={po.id}
                                className={cn(
                                    "hover:bg-muted/50",
                                    po.hasVariance && "bg-yellow-50/50"
                                )}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{po.poNumber}</span>
                                        {po.hasVariance && (
                                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell>
                                    <POStatusBadge status={po.status} />
                                </TableCell>
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

                                        {/* Nút kiểm hàng */}
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="text-blue-600 hover:bg-blue-50 border-blue-200"
                                            disabled={
                                                po.status !== "NEW" ||
                                                isCreating // Disable khi đang gọi API
                                            }
                                            onClick={() => handleStartCheck(po.id)}
                                        >
                                            <ScanBarcode className="w-4 h-4 mr-2" />
                                            {/* Có thể thêm icon spinner loading nếu isCreating === true */}
                                            Tạo phiếu
                                        </Button>

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
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="border-t bg-muted/20">
                <PaginationControls
                    currentPage={pagination.currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={pagination.onPageChange}
                    totalItems={pagination.totalItems}
                />
            </div>

            {/* Dialog giữ nguyên */}
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
                            Tổng: {selectedPO?.totalItems} sản phẩm
                        </DialogDescription>
                    </DialogHeader>

                    <div className="max-h-[60vh] overflow-y-auto border rounded-md">
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted z-10">
                                <TableRow>
                                    <TableHead>STT</TableHead>
                                    <TableHead>Tên sản phẩm</TableHead>
                                    <TableHead>SKU</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {selectedPO?.details?.map((item, idx) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="w-[50px] text-center">{idx + 1}</TableCell>
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