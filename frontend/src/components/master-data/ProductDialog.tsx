import { ProductDialogProps } from "@/types/product";
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
import { Loader2, Link, X, Info } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProductForm } from "@/hooks/useProductForm";

export function ProductDialog({
  open,
  onOpenChange,
  categories,
  onSuccess,
}: ProductDialogProps) {
  const {
    formData,
    setFormData,
    isSubmitting,
    uploadMethod,
    setUploadMethod,
    imageUrl,
    imagePreview,
    handleUrlChange,
    clearImage,
    createProduct,
    resetForm,
  } = useProductForm(categories, onSuccess);

  const handleSubmit = async () => {
    const success = await createProduct();
    if (success) {
      onOpenChange(false);
      resetForm();
      onSuccess();
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  // ✅ Get selected category để preview SKU
  const selectedCategory = categories.find(
    (c) => String(c.id) === formData.categoryId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm mới</DialogTitle>
          <DialogDescription>
            Điền đầy đủ thông tin để tạo Master Data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* ✅ SKU - AUTO GENERATE - Hiển thị thông báo thay vì input */}
          <div className="space-y-2">
            <Label>Mã SKU</Label>
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm text-blue-900">
                Mã SKU sẽ được hệ thống tự động tạo dựa trên danh mục sản phẩm
                {selectedCategory && (
                  <span className="block mt-1 font-mono text-xs text-blue-700">
                    Dự kiến: SKU-{selectedCategory.code}
                    <span className="text-muted-foreground">?</span>
                    <span className="text-xs ml-2">(số sẽ tự động sinh)</span>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          </div>

          {/* Các field khác */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Barcode (Mã vạch)</Label>
              <Input
                placeholder="VD: 893..."
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Đơn vị tính</Label>
              <Input
                placeholder="Cái, Hộp..."
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Tên sản phẩm <span className="text-red-500">*</span>
            </Label>
            <Input
              placeholder="VD: iPhone 15 Pro Max..."
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>
              Danh mục <span className="text-red-500">*</span>
            </Label>
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
                    {c.name} {c.code && `(${c.code})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Giá tiêu chuẩn (VND)</Label>
              <Input
                type="number"
                min="0"
                step="1000"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Image Section */}
            <div className="space-y-2">
              <Label>Ảnh sản phẩm</Label>
              <Tabs
                value={uploadMethod}
                onValueChange={(v) => setUploadMethod(v as "url")}
                className="w-full"
              >
                <TabsList className="w-full">
                  <TabsTrigger value="url" className="gap-2">
                    <Link className="w-3 h-3" />
                    Link ảnh
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="url" className="space-y-2 mt-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nhập URL ảnh từ internet
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Xem trước ảnh</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearImage}
                  className="h-6 px-2 text-xs"
                >
                  <X className="w-3 h-3 mr-1" />
                  Xóa ảnh
                </Button>
              </div>
              <div className="flex justify-center">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg border object-contain"
                  onError={() => {
                    // setImagePreview(null); // Remove this line to prevent type error
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Mô tả chi tiết sản phẩm..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Tạo mới
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
