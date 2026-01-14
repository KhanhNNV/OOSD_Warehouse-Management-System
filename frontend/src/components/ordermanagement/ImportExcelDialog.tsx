import { useState, useCallback } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Customer } from "@/types/outboundordermanagement";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface ImportExcelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  onSubmit: (
    file: File,
    customerId: number,
    toName: string,
    toPhone: string,
    toAddress: string
  ) => Promise<boolean>;
  isSubmitting: boolean;
}

export function ImportExcelDialog({
  open,
  onOpenChange,
  customers,
  onSubmit,
  isSubmitting,
}: ImportExcelDialogProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [toName, setToName] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [toAddress, setToAddress] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const resetForm = () => {
    setCustomerId("");
    setToName("");
    setToPhone("");
    setToAddress("");
    setUploadFile(null);
    setIsDragging(false);
  };

  const validateAndSetFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Sai định dạng",
        description: "Vui lòng chọn file Excel (.xlsx hoặc .xls)",
        variant: "destructive",
      });
      return;
    }

    setUploadFile(file);
  };

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const customer = customers.find((c) => c.id === parseInt(value));
    if (customer) {
      setToName(customer.name);
      setToPhone(customer.phone);
      setToAddress(customer.address);
    }
  };

  const handleSubmit = async () => {
    if (!uploadFile || !customerId || !toName || !toPhone || !toAddress) {
      return;
    }

    const success = await onSubmit(
      uploadFile,
      parseInt(customerId),
      toName,
      toPhone,
      toAddress
    );

    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ FIXED: Thêm max-h và overflow-y-auto */}
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Import đơn hàng từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file Excel chứa danh sách sản phẩm cần xuất kho
          </DialogDescription>
        </DialogHeader>

        {/* ✅ FIXED: Thêm overflow-y-auto cho phần content */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-4 py-4">
            {/* Chọn khách hàng */}
            <div>
              <Label htmlFor="customer-import">Khách hàng *</Label>
              <Select value={customerId} onValueChange={handleCustomerChange}>
                <SelectTrigger id="customer-import" className="mt-1">
                  <SelectValue placeholder="Chọn khách hàng" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(customers) && customers.length > 0 ? (
                    customers.map((customer) => (
                      <SelectItem
                        key={customer.id}
                        value={customer.id.toString()}
                      >
                        {customer.name} - {customer.phone}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-customers" disabled>
                      Không có khách hàng nào
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Thông tin giao hàng */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="toName-import">Tên người nhận *</Label>
                <Input
                  id="toName-import"
                  value={toName}
                  onChange={(e) => setToName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="toPhone-import">Số điện thoại *</Label>
                <Input
                  id="toPhone-import"
                  value={toPhone}
                  onChange={(e) => setToPhone(e.target.value)}
                  placeholder="0901234567"
                  className="mt-1"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="toAddress-import">Địa chỉ giao hàng *</Label>
                <Input
                  id="toAddress-import"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Upload zone */}
            <div>
              <Label>File Excel *</Label>
              <div
                className={cn(
                  "mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400",
                  uploadFile && "border-green-500 bg-green-50"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() =>
                  !uploadFile &&
                  document.getElementById("hidden-file-input-import")?.click()
                }
              >
                <input
                  id="hidden-file-input-import"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!uploadFile ? (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm font-medium">
                      Kéo thả file vào đây hoặc click để chọn
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Hỗ trợ file .xlsx, .xls
                    </p>
                  </>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <FileSpreadsheet className="w-8 h-8 text-green-600" />
                    <div className="text-left">
                      <p className="text-sm font-medium">{uploadFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(uploadFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    {!isSubmitting && (
                      <Button
                        size="sm"
                        variant="ghost"
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

            {/* Format hướng dẫn */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900 mb-2">
                📋 Format file Excel:
              </p>
              <ul className="text-xs text-blue-800 space-y-1">
                <li>• Cột A: Tên sản phẩm</li>
                <li>• Cột B: Mã SKU</li>
                <li>• Cột C: Số lượng</li>
                <li>• Dòng đầu tiên là header (sẽ bị bỏ qua)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Footer cố định ở dưới */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !uploadFile ||
              !customerId ||
              !toName ||
              !toPhone ||
              !toAddress ||
              isSubmitting
            }
          >
            {isSubmitting ? "Đang xử lý..." : "Import đơn hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
