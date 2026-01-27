// components/dialogs/CategoryDialog.tsx

import { useState } from "react";
import { masterService } from "@/services/master.service";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label"; // ✅ Import Label
import { Loader2 } from "lucide-react";

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CategoryDialog({
  open,
  onOpenChange,
  onSuccess,
}: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "", // ✅ NEW: Thêm code
    name: "",
    description: "",
  });

  const handleSubmit = async () => {
    // ✅ Validate code (required)
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

    // ✅ Validate code format (optional - chỉ cho phép chữ in hoa và số)
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
      await masterService.createCategory({
        code: formData.code.toUpperCase(), // ✅ Convert to uppercase
        name: formData.name,
        description: formData.description,
      });

      toast({
        title: "Thành công",
        description: "Đã thêm danh mục mới",
      });

      onOpenChange(false);
      setFormData({ code: "", name: "", description: "" }); // ✅ Reset code
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Lỗi tạo danh mục",
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
          <DialogTitle>Thêm Danh mục mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* ✅ NEW: Code Input */}
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
                  code: e.target.value.toUpperCase(), // ✅ Auto uppercase
                })
              }
              className="font-mono"
              maxLength={50}
            />
            <p className="text-xs text-slate-500">
              Chỉ sử dụng chữ in hoa, số và dấu gạch ngang/dưới
            </p>
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
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setFormData({ code: "", name: "", description: "" }); // ✅ Reset on cancel
            }}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Lưu lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
