import { useState, useCallback } from "react";
import {
    Upload,
    FileSpreadsheet,
    Search,
    Filter,
    Eye,
    Loader2,
    X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { POStatusBadge } from "@/components/inbound/POStatusBadge"; // Component của bạn
import { useInbound } from "@/hooks/useInbound";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {usePO} from "@/hooks/usePO.ts";

export default function InboundPageManager() {
    const {
        orders,
        suppliers,
        searchTerm,
        setSearchTerm,
        isLoading,
        isUploading,
        handleUploadPO,
    } = usePO();

    // State quản lý UI Upload
    const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [selectedSupplierId, setSelectedSupplierId] = useState<string>("");

    // --- Date Formatting ---
    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // --- Drag & Drop Handlers ---
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    }, []);

    const validateAndSetFile = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast({
                title: "Sai định dạng",
                description: "Vui lòng chọn file Excel",
                variant: "destructive",
            });
            return;
        }
        setUploadFile(file);
    };

    const onSubmitUpload = () => {
        if (!uploadFile || !selectedSupplierId) return;

        handleUploadPO(uploadFile, selectedSupplierId, () => {
            // Callback khi thành công
            setIsUploadDialogOpen(false);
            setUploadFile(null);
            setSelectedSupplierId("");
        });
    };

    return (
        <div className="animate-fade-in space-y-6">
            <PageHeader
                title="Quản lý Nhập kho (Inbound)"
                description="Theo dõi PO và xử lý đơn hàng từ Nhà cung cấp"
                action={
                    <Button onClick={() => setIsUploadDialogOpen(true)}>
                        <Upload className="w-4 h-4 mr-2" />
                        Tạo PO từ Excel
                    </Button>
                }
            />

            {/* --- Filter Bar --- */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm theo mã PO, NCC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="w-4 h-4 mr-2" />
                    Bộ lọc
                </Button>
            </div>

            {/* --- Main Table --- */}
            <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-semibold">Mã PO</TableHead>
                            <TableHead className="font-semibold">Nhà cung cấp</TableHead>
                            <TableHead className="font-semibold">Trạng thái</TableHead>
                            <TableHead className="font-semibold text-right">
                                Tổng Items
                            </TableHead>
                            <TableHead className="font-semibold">Ngày tạo</TableHead>
                            <TableHead className="font-semibold">Dự kiến nhận</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                        <Loader2 className="w-5 h-5 animate-spin" /> Đang tải dữ
                                        liệu...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : orders.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={7}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Không tìm thấy đơn hàng nào.
                                </TableCell>
                            </TableRow>
                        ) : (
                            orders.map((po) => (
                                <TableRow
                                    key={po.id}
                                    className="hover:bg-muted/30 cursor-pointer group transition-colors"
                                    // onClick để chuyển sang trang chi tiết (Phase sau)
                                >
                                    <TableCell>
                    <span className="font-medium text-primary">
                      {po.poNumber}
                    </span>
                                    </TableCell>
                                    <TableCell>{po.supplierName}</TableCell>
                                    <TableCell>
                                        {/* Dùng component Badge bạn đã tạo */}
                                        <POStatusBadge status={po.status} />
                                    </TableCell>
                                    <TableCell className="text-right font-semibold">
                                        {po.totalItems}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(po.createdAt)}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatDate(po.expectedDate)}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Eye className="w-4 h-4 text-muted-foreground" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* --- Upload Dialog --- */}
            <Dialog
                open={isUploadDialogOpen}
                onOpenChange={isUploading ? undefined : setIsUploadDialogOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Tạo phiếu nhập từ Excel</DialogTitle>
                        <DialogDescription>
                            Tải lên file danh sách hàng hóa và chọn Nhà cung cấp tương ứng.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        {/* Chọn NCC */}
                        <div className="space-y-2">
                            <Label>
                                Nhà cung cấp <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedSupplierId}
                                onValueChange={setSelectedSupplierId}
                                disabled={isUploading}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="-- Chọn Nhà cung cấp --" />
                                </SelectTrigger>
                                <SelectContent>
                                    {suppliers.map((sup) => (
                                        <SelectItem key={sup.id} value={String(sup.id)}>
                                            {sup.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Upload Dropzone */}
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                                isDragging
                                    ? "border-primary bg-primary/5"
                                    : "border-gray-200 hover:border-primary/50",
                                (uploadFile || isUploading) && "border-green-200 bg-green-50/30"
                            )}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() =>
                                !uploadFile &&
                                document.getElementById("hidden-file-input")?.click()
                            }
                        >
                            <input
                                type="file"
                                id="hidden-file-input"
                                className="hidden"
                                accept=".xlsx,.xls"
                                onChange={(e) =>
                                    e.target.files?.[0] && validateAndSetFile(e.target.files[0])
                                }
                            />

                            {!uploadFile ? (
                                <>
                                    <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm font-medium">
                                        Kéo thả file vào đây hoặc click để chọn
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Hỗ trợ .xlsx, .xls
                                    </p>
                                </>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded text-green-700">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium text-sm text-gray-900">
                                                {uploadFile.name}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {(uploadFile.size / 1024).toFixed(1)} KB
                                            </p>
                                        </div>
                                    </div>
                                    {!isUploading && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setUploadFile(null);
                                            }}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsUploadDialogOpen(false)}
                            disabled={isUploading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={onSubmitUpload}
                            disabled={!uploadFile || !selectedSupplierId || isUploading}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Đang xử
                                    lý...
                                </>
                            ) : (
                                "Tạo đơn nhập"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}