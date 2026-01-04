import { useState } from "react";
import { useNavigate } from "react-router-dom"; // Đã có

import { Upload, Search, Filter, AlertTriangle, FileSpreadsheet, ScanBarcode } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.tsx";
import { POStatusBadge } from "@/components/inbound/POStatusBadge.tsx";
import { useInbound } from "@/hooks/useInbound.ts";
import { cn } from "@/lib/utils.ts";

export default function InboundPage() {
    const { orders, searchTerm, setSearchTerm, handleFileUpload } = useInbound();
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const navigate = useNavigate();

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Nhập kho (Inbound)"
                description="Theo dõi đơn mua hàng (PO) và tiến độ nhận hàng từ NCC."
                action={
                    <Button onClick={() => setIsUploadOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" /> Nhập Excel PO
                    </Button>
                }
            />

            {/* Filter Bar */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo PO, Nhà cung cấp..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline"><Filter className="w-4 h-4 mr-2" /> Bộ lọc</Button>
            </div>

            {/* Main Table */}
            <div className="bg-card rounded-xl border overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50">
                            <TableHead>Mã PO</TableHead>
                            <TableHead>Nhà cung cấp</TableHead>
                            <TableHead>Trạng thái</TableHead>
                            <TableHead className="text-right">Tiến độ nhận</TableHead>
                            <TableHead>Ngày dự kiến</TableHead>
                            <TableHead className="w-[140px] text-right">Hành động</TableHead> {/* Tăng width lên xíu cho nút dài */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((po) => (
                            <TableRow key={po.id} className={cn("hover:bg-muted/50", po.hasVariance && "bg-yellow-50/50")}>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{po.poNumber}</span>
                                        {po.hasVariance && <AlertTriangle className="w-4 h-4 text-yellow-600" aria-label="Có lệch số lượng" />}
                                    </div>
                                </TableCell>
                                <TableCell>{po.supplierName}</TableCell>
                                <TableCell>
                                    <POStatusBadge status={po.status} />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {po.receivedItems} / {po.totalItems}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(po.expectedDate).toLocaleDateString('vi-VN')}
                                </TableCell>

                                {/* 👇 ĐOẠN CODE QUAN TRỌNG ĐÃ SỬA 👇 */}
                                <TableCell className="text-right">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "border-blue-200",
                                            // Logic màu sắc:
                                            // 1. Nếu lệch mà QUÁ 3 LẦN -> Màu xám (Disabled style)
                                            (po.status === 'DISCREPANCY' && (po.retryCount || 0) >= 3) ? "text-slate-500 border-slate-200 bg-slate-100" :
                                                // 2. Nếu lệch (còn lượt) -> Màu cam
                                                po.status === 'DISCREPANCY' ? "text-amber-600 border-amber-200 hover:bg-amber-50" :
                                                    // 3. Mặc định -> Màu xanh
                                                    "text-blue-600 hover:bg-blue-50"
                                        )}

                                        // Logic khóa nút (Disabled):
                                        // Khóa khi: Đã xong HOẶC Đã hủy HOẶC (Lệch quá 3 lần)
                                        disabled={
                                            po.status === 'COMPLETED' ||
                                            po.status === 'CANCELLED' ||
                                            (po.status === 'DISCREPANCY' && (po.retryCount || 0) >= 3)
                                        }

                                        onClick={() => navigate(`/staff/scan-test?id=${po.id}`)}
                                    >
                                        {/* Logic hiển thị chữ bên trong nút: */}

                                        {/* Case 1: Quá 3 lần -> Hiện "Chờ Q.Lý duyệt" */}
                                        {(po.status === 'DISCREPANCY' && (po.retryCount || 0) >= 3) ? (
                                                <><AlertTriangle className="w-4 h-4 mr-2" /> Chờ Q.Lý duyệt</>
                                            ) :

                                            /* Case 2: Lệch còn lượt -> Hiện "Quét bù (số lần/3)" */
                                            po.status === 'DISCREPANCY' ? (
                                                    <><ScanBarcode className="w-4 h-4 mr-2" /> Quét bù ({(po.retryCount || 0) + 1}/3)</>
                                                ) :

                                                /* Case 3: Mới tinh -> Hiện "Kiểm hàng" */
                                                (
                                                    <><ScanBarcode className="w-4 h-4 mr-2" /> Kiểm hàng</>
                                                )}
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Upload Dialog (Giữ nguyên) */}
            <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Tải lên PO</DialogTitle></DialogHeader>
                    <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center">
                        <FileSpreadsheet className="w-10 h-10 text-muted-foreground mb-2"/>
                        <input type="file" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                               onChange={(e) => {
                                   if (e.target.files?.[0]) {
                                       handleFileUpload(e.target.files[0]);
                                       setIsUploadOpen(false);
                                   }
                               }}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}