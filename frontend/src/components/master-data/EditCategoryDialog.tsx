// components/dialogs/EditCategoryDialog.tsx

import { useState, useEffect } from "react";
import { Category } from "@/types/wms";
import { masterService } from "@/services/master.service";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // ✅ Import Label
import { Loader2 } from "lucide-react";

interface EditCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSuccess: () => void;
}

export function EditCategoryDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: EditCategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", // ✅ NEW: Thêm code
    name: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        code: category.code || "", // ✅ Load code from category
        name: category.name || "",
        description: category.description || "",
      });
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!category) return;

    // ✅ Validate code
    if (!formData.code.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập mã danh mục",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validate name
    if (!formData.name.trim()) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên danh mục",
        variant: "destructive",
      });
      return;
    }

    // ✅ Validate code format
    const codePattern = /^[A-Z0-9_-]+$/;
    if (!codePattern.test(formData.code)) {
      toast({
        title: "Mã không hợp lệ",
        description:
          "Mã danh mục chỉ được chứa chữ in hoa, số, dấu gạch ngang và gạch dưới",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await masterService.updateCategory(category.id, {
        code: formData.code.toUpperCase(), // ✅ Convert to uppercase
        name: formData.name,
        description: formData.description,
      });

      toast({
        title: "Thành công",
        description: "Đã cập nhật danh mục",
      });

      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!category) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Danh mục</DialogTitle>
          <DialogDescription>
            Chỉnh sửa:{" "}
            <span className="font-mono font-bold">{category.code}</span> -{" "}
            {category.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ✅ NEW: Code Input (với warning nếu thay đổi) */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              Mã danh mục <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              placeholder="VD: FOOD, BEVERAGE, ELECTRONICS..."
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.toUpperCase(),
                })
              }
              className="font-mono"
              maxLength={50}
            />
            {formData.code !== category.code && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                <span>⚠️</span>
                <p>
                  Thay đổi mã danh mục có thể ảnh hưởng đến các sản phẩm đã liên
                  kết. Hãy chắc chắn trước khi lưu.
                </p>
              </div>
            )}
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Tên danh mục <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Tên danh mục"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả <span className="text-slate-400">(không bắt buộc)</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Mô tả chi tiết về danh mục này..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cập nhật
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
