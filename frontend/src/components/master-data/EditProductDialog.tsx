import { useState, useEffect, useRef } from "react";
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
import { Loader2, Upload, Link, X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

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
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("url");
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    sku: "",
    name: "",
    barcode: "",
    categoryId: "",
    unit: "Cái",
    price: 0,
    // description: "",
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
        // description: product.description || "",
      });

      // Set image preview từ sản phẩm hiện tại
      if (product.imageUrl) {
        setImageUrl(product.imageUrl);
        // Kiểm tra nếu là URL hợp lệ
        try {
          new URL(product.imageUrl);
          setImagePreview(product.imageUrl);
          setUploadMethod("url");
        } catch (error: any) {
          // Nếu không phải URL hợp lệ, có thể là tên file
          // Tạo preview từ server
          // const fullImageUrl = product.imageUrl.startsWith("http")
          //   ? product.imageUrl
          //   : `http://localhost:8080${product.imageUrl}`;
          // setImagePreview(fullImageUrl);
          // setUploadMethod("url");
          error("Invalid image URL in product data");
        }
      } else {
        setImageUrl("");
        setImagePreview(null);
      }

      // Reset file input
      // setProductImageFile(null);
      // if (fileInputRef.current) {
      //   fileInputRef.current.value = "";
      // }
    }
  }, [product]);

  // Handle file selection
  // const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (file) {
  //     // Validate file type
  //     if (!file.type.startsWith("image/")) {
  //       toast({
  //         title: "File không hợp lệ",
  //         description: "Vui lòng chọn file ảnh (JPEG, PNG, GIF, etc.)",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     // Validate file size (max 5MB)
  //     if (file.size > 5 * 1024 * 1024) {
  //       toast({
  //         title: "File quá lớn",
  //         description: "Kích thước file không được vượt quá 5MB",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     setProductImageFile(file);
  //     setImageUrl("");
  //     setUploadMethod("file");

  //     // Create preview
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setImagePreview(reader.result as string);
  //     };
  //     reader.readAsDataURL(file);
  //   }
  // };

  // Handle URL change
  const handleUrlChange = (url: string) => {
    setImageUrl(url);
    // setProductImageFile(null);
    setUploadMethod("url");

    // Validate URL format
    if (url) {
      try {
        new URL(url);
        setImagePreview(url);
      } catch {
        setImagePreview(null);
      }
    } else {
      setImagePreview(null);
    }
  };

  // Clear image
  const clearImage = () => {
    // setProductImageFile(null);
    setImageUrl("");
    setImagePreview(null);
    // if (fileInputRef.current) {
    //   fileInputRef.current.value = "";
    // }
  };

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

    // Validate image URL if using URL method
    if (uploadMethod === "url" && imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        toast({
          title: "URL ảnh không hợp lệ",
          description: "Vui lòng nhập URL ảnh hợp lệ",
          variant: "destructive",
        });
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();

      // Add basic form data
      data.append("sku", formData.sku);
      data.append("name", formData.name);
      data.append("barcode", formData.barcode || "");
      data.append("unit", formData.unit);
      data.append("price", formData.price.toString());
      data.append("categoryId", formData.categoryId);

      // if (formData.description) {
      //   data.append("description", formData.description);
      // }

      // Add image based on upload method
      if (uploadMethod === "file" && productImageFile) {
        data.append("image", productImageFile);
      } else if (uploadMethod === "url" && imageUrl) {
        // For URL, send it as a text field
        data.append("imageUrl", imageUrl);
      } else if (uploadMethod === "url" && !imageUrl) {
        // If clearing image (empty URL)
        data.append("imageUrl", "");
      }

      await masterService.updateProduct(Number(product.id), data);

      toast({
        title: "Thành công",
        description: "Đã cập nhật sản phẩm",
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

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
          <DialogDescription>
            Chỉnh sửa thông tin sản phẩm: {product.sku}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Mã SKU <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="VD: IP15-PRO"
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
              />
            </div>
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

          <div className="grid grid-cols-2 gap-4">
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
                      {c.name || c.name || `Danh mục ${c.id}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                onValueChange={(v) => setUploadMethod(v as "file" | "url")}
                className="w-full"
              >
                <TabsList className="grid grid-cols-2 w-full">
                  {/* <TabsTrigger value="file" className="gap-2">
                    <Upload className="w-3 h-3" />
                    Upload file mới
                  </TabsTrigger> */}
                  <TabsTrigger value="url" className="gap-2">
                    <Link className="w-3 h-3" />
                    Link ảnh
                  </TabsTrigger>
                </TabsList>

                {/* <TabsContent value="file" className="space-y-2 mt-2">
                  <div className="flex flex-col gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      Chấp nhận: JPEG, PNG, GIF. Tối đa 5MB
                    </p>
                    {product.imageUrl && !productImageFile && (
                      <p className="text-xs text-blue-600">
                        Ảnh hiện tại sẽ được thay thế
                      </p>
                    )}
                  </div>
                </TabsContent> */}

                <TabsContent value="url" className="space-y-2 mt-2">
                  <Input
                    type="url"
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nhập URL ảnh từ internet. Để trống để xóa ảnh hiện tại.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Image Preview */}
          {(imagePreview || product.imageUrl) && (
            <div className="space-y-2 border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm">
                  {productImageFile
                    ? "Xem trước ảnh mới"
                    : imageUrl
                    ? "Xem trước URL ảnh"
                    : "Ảnh hiện tại"}
                </Label>
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
                  src={
                    imagePreview ||
                    (product.imageUrl?.startsWith("http")
                      ? product.imageUrl
                      : `http://localhost:8080${product.imageUrl}`)
                  }
                  alt="Preview"
                  className="max-h-40 rounded-lg border object-contain"
                  onError={() => {
                    setImagePreview(null);
                    toast({
                      title: "Không thể tải ảnh",
                      description: "Vui lòng kiểm tra lại file hoặc URL",
                      variant: "destructive",
                    });
                  }}
                />
              </div>
              {!imagePreview && !productImageFile && imageUrl && (
                <p className="text-xs text-yellow-600 text-center">
                  URL không hợp lệ hoặc không thể tải ảnh
                </p>
              )}
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
