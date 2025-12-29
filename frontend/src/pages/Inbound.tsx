import { useState } from "react";
import { Upload, Search, Filter, Eye, AlertTriangle, FileSpreadsheet } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { POStatusBadge } from "@/components/inbound/POStatusBadge"; // Badge riêng
import { useInbound } from "@/hooks/useInbound";
import { cn } from "@/lib/utils";

export default function InboundPage() {
    const { orders, searchTerm, setSearchTerm, handleFileUpload } = useInbound();
    const [isUploadOpen, setIsUploadOpen] = useState(false);

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
                            <TableHead className="w-[50px]"></TableHead>
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
                                    {/* Sử dụng Badge chuyên biệt của Inbound */}
                                    <POStatusBadge status={po.status} />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {po.receivedItems} / {po.totalItems}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {new Date(po.expectedDate).toLocaleDateString('vi-VN')}
                                </TableCell>
                                <TableCell>
                                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Upload Dialog (Simplified) */}
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