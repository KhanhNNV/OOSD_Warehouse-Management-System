import { useState, useCallback } from "react";
import { masterService } from "@/services/master.service";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, X, Loader2 } from "lucide-react";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: ImportDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

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
      const file = e.dataTransfer.files[0];
      validateFile(file);
    }
  }, []);

  const validateFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Sai định dạng",
        description: "Chỉ chấp nhận file Excel (.xlsx, .xls)",
        variant: "destructive",
      });
      return;
    }
    setImportFile(file);
  };

  const handleSubmit = async () => {
    if (!importFile) {
      toast({
        title: "Chưa chọn file",
        description: "Vui lòng chọn file Excel để import",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("file", importFile);

      // Gọi API import (cần implement)
      // await masterService.importProducts(formData);

      toast({ title: "Thành công", description: "Import sản phẩm thành công" });
      onOpenChange(false);
      setImportFile(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Lỗi import",
        description: error?.response?.data?.message || "Lỗi xử lý file Excel",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import sản phẩm từ Excel</DialogTitle>
          <DialogDescription>
            Tải lên file Excel chứa danh sách sản phẩm. Định dạng file cần có
            các cột: SKU, Tên, Barcode, Đơn vị, Giá, Danh mục.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-200 hover:border-primary/50",
              importFile && "border-green-200 bg-green-50/30"
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() =>
              !importFile &&
              document.getElementById("excel-file-input")?.click()
            }
          >
            <input
              type="file"
              id="excel-file-input"
              className="hidden"
              accept=".xlsx,.xls"
              onChange={(e) =>
                e.target.files?.[0] && validateFile(e.target.files[0])
              }
            />

            {!importFile ? (
              <>
                <FileSpreadsheet className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-sm font-medium">
                  Kéo thả file Excel vào đây hoặc click để chọn
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
                      {importFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(importFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImportFile(null);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>File Excel cần có cột tiêu đề chính xác</li>
              <li>SKU không được trùng với sản phẩm đã có</li>
              <li>
                Có thể tải file mẫu{" "}
                <a href="#" className="text-primary hover:underline">
                  tại đây
                </a>
              </li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={!importFile || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
