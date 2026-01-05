import { useState, useEffect } from "react";
import { Product, Category } from "@/types/wms";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
}

export function EditProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: EditProductDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImage, setProductImage] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    barcode: "",
    categoryId: "",
    unit: "Cái",
    price: 0,
    description: "",
  });

  // Load product data khi mở dialog
  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || "",
        name: product.name || "",
        barcode: product.barcode || "",
        categoryId: String(product.categoryId || ""),
        unit: product.unit || "Cái",
        price: product.price || 0,
        description: product.description || "",
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    if (!product) return;

    if (!formData.sku || !formData.name || !formData.categoryId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập SKU, Tên và Danh mục",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append("sku", formData.sku);
      data.append("name", formData.name);
      data.append("barcode", formData.barcode || "");
      data.append("unit", formData.unit);
      data.append("price", formData.price.toString());
      data.append("categoryId", formData.categoryId);
      if (formData.description) {
        data.append("description", formData.description);
      }
      if (productImage) {
        data.append("image", productImage);
      }

      await masterService.updateProduct(Number(product.id), data);

      toast({ title: "Thành công", description: "Đã cập nhật sản phẩm" });
      onOpenChange(false);
      resetForm();
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

  const resetForm = () => {
    setFormData({
      sku: "",
      name: "",
      barcode: "",
      categoryId: "",
      unit: "Cái",
      price: 0,
      description: "",
    });
    setProductImage(null);
  };

  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin sản phẩm: {product.sku}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Mã SKU *</Label>
              <Input
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Barcode</Label>
              <Input
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tên sản phẩm *</Label>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Danh mục *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(val) =>
                  setFormData({ ...formData, categoryId: val })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name || c.name || `Danh mục ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Đơn vị tính</Label>
              <Input
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giá (VND)</Label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Ảnh mới (thay thế)</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setProductImage(e.target.files?.[0] || null)}
              />
              {product.imageUrl && !productImage && (
                <p className="text-xs text-muted-foreground">
                  Ảnh hiện tại: {product.imageUrl}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
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
