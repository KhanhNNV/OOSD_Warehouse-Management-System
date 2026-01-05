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
    name: "",
    description: "",
  });

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || category.name || "",
        description: category.description || "",
      });
    }
  }, [category]);

  const handleSubmit = async () => {
    if (!category) return;

    if (!formData.name) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập tên danh mục",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await masterService.updateCategory(category.id, { name: formData.name, description:formData.description });
      toast({ title: "Thành công", description: "Đã cập nhật danh mục" });
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chỉnh sửa Danh mục</DialogTitle>
          <DialogDescription>
            Chỉnh sửa: {category.name || category.name}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="Tên danh mục (*)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Textarea
            placeholder="Mô tả"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={2}
          />
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
