import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, Search, Filter, Eye, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { PurchaseOrder } from "@/types/wms";
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
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockPOs: PurchaseOrder[] = [
  {
    id: "1",
    poNumber: "PO-2024-001",
    supplierName: "Samsung Vietnam",
    status: "pending",
    createdAt: "2024-10-14T08:00:00Z",
    expectedDate: "2024-10-16T08:00:00Z",
    totalItems: 50,
    receivedItems: 0,
    hasVariance: false,
  },
  {
    id: "2",
    poNumber: "PO-2024-002",
    supplierName: "Apple Vietnam",
    status: "receiving",
    createdAt: "2024-10-13T10:00:00Z",
    expectedDate: "2024-10-15T08:00:00Z",
    totalItems: 100,
    receivedItems: 45,
    hasVariance: true,
  },
  {
    id: "3",
    poNumber: "PO-2024-003",
    supplierName: "Dell Technologies",
    status: "putaway",
    createdAt: "2024-10-12T14:00:00Z",
    expectedDate: "2024-10-14T08:00:00Z",
    totalItems: 30,
    receivedItems: 30,
    hasVariance: false,
  },
  {
    id: "4",
    poNumber: "PO-2024-004",
    supplierName: "LG Electronics",
    status: "completed",
    createdAt: "2024-10-10T09:00:00Z",
    expectedDate: "2024-10-12T08:00:00Z",
    totalItems: 75,
    receivedItems: 75,
    hasVariance: false,
  },
];

const statusMap: Record<PurchaseOrder["status"], StatusType> = {
  pending: "pending",
  receiving: "processing",
  putaway: "processing",
  completed: "completed",
};

export default function InboundPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(mockPOs);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const filteredPOs = purchaseOrders.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast({
        title: "Lỗi định dạng file",
        description: "Vui lòng chọn file Excel (.xlsx hoặc .xls)",
        variant: "destructive",
      });
      return;
    }

    // Simulate file processing
    const newPO: PurchaseOrder = {
      id: String(purchaseOrders.length + 1),
      poNumber: `PO-2024-${String(purchaseOrders.length + 1).padStart(3, "0")}`,
      supplierName: "Nhà cung cấp từ Excel",
      status: "pending",
      createdAt: new Date().toISOString(),
      expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      totalItems: Math.floor(Math.random() * 100) + 20,
      receivedItems: 0,
      hasVariance: false,
    };

    setPurchaseOrders([newPO, ...purchaseOrders]);
    setIsUploadDialogOpen(false);
    toast({
      title: "Nhập file thành công",
      description: `Đã tạo đơn ${newPO.poNumber} với ${newPO.totalItems} sản phẩm.`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Nhập kho"
        description="Theo dõi và xử lý các đơn hàng nhập kho"
        action={
          <Button onClick={() => setIsUploadDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Nhập file Excel
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo mã PO, nhà cung cấp..."
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

      {/* PO Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Mã PO</TableHead>
              <TableHead className="font-semibold">Nhà cung cấp</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="font-semibold text-right">Số lượng</TableHead>
              <TableHead className="font-semibold">Ngày tạo</TableHead>
              <TableHead className="font-semibold">Ngày dự kiến</TableHead>
              <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPOs.map((po) => (
              <TableRow
                key={po.id}
                className={cn(
                  "hover:bg-table-row-hover transition-colors",
                  po.hasVariance && "bg-variance-bg/50 border-l-4 border-l-variance-border"
                )}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{po.poNumber}</span>
                    {po.hasVariance && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </TableCell>
                <TableCell>{po.supplierName}</TableCell>
                <TableCell>
                  <StatusBadge status={statusMap[po.status]} />
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">
                    {po.receivedItems}/{po.totalItems}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(po.createdAt)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(po.expectedDate)}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nhập đơn hàng từ Excel</DialogTitle>
            <DialogDescription>
              Tải lên file Excel từ nhà cung cấp để tạo đơn nhập hàng tự động.
            </DialogDescription>
          </DialogHeader>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Kéo thả file vào đây</p>
            <p className="text-sm text-muted-foreground mb-4">
              hoặc click để chọn file (.xlsx, .xls)
            </p>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" asChild>
                <span>Chọn file</span>
              </Button>
            </label>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
