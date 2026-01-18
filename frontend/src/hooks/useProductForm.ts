import { useState, useRef } from "react";
import { Category } from "@/types/wms";
import { masterService } from "@/services/master.service";
import { toast } from "@/hooks/use-toast";

export interface ProductFormData {
  // sku: string;
  name: string;
  barcode: string;
  categoryId: string;
  unit: string;
  price: number;
  description: string;
}

export function useProductForm(categories: Category[], onSuccess: () => void) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<"url">("url");
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    // sku: "",
    name: "",
    barcode: "",
    categoryId: "",
    unit: "Cái",
    price: 0,
    description: "",
  });

  // Handle URL change
  const handleUrlChange = (url: string) => {
    setImageUrl(url);
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
    setImageUrl("");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name || !formData.categoryId) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng nhập Tên và Danh mục",
        variant: "destructive",
      });
      return false;
    }

    // Validate image URL if provided
    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        toast({
          title: "URL ảnh không hợp lệ",
          description: "Vui lòng nhập URL ảnh hợp lệ",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // Create product
  const createProduct = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      const data = new FormData();

      // Add basic form data
      // data.append("sku", formData.sku);
      data.append("name", formData.name);
      data.append("barcode", formData.barcode || "");
      data.append("unit", formData.unit);
      data.append("price", formData.price.toString());
      data.append("categoryId", formData.categoryId);

      if (formData.description) {
        data.append("description", formData.description);
      }

      // Add image URL
      if (imageUrl) {
        data.append("imageUrl", imageUrl);
      }

      await masterService.createProduct(data);

      toast({
        title: "Thành công",
        description: "Đã tạo sản phẩm mới",
      });
      return true;
    } catch (error: any) {
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Tạo sản phẩm thất bại",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update product
  const updateProduct = async (productId: number) => {
    if (!validateForm()) {
      console.log("❌ Validation failed");
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();

      // Add basic form data
      // data.append("sku", formData.sku);
      data.append("name", formData.name);
      data.append("barcode", formData.barcode || "");
      data.append("unit", formData.unit);
      data.append("price", formData.price.toString());
      data.append("categoryId", formData.categoryId);

      if (formData.description) {
        data.append("description", formData.description);
      }

      // Add image URL
      if (imageUrl) {
        data.append("imageUrl", imageUrl);
      }

      await masterService.updateProduct(productId, data);

      toast({
        title: "Thành công",
        description: "Đã cập nhật sản phẩm",
      });
      return true;
    } catch (error: any) {
      console.error("❌ Update failed:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Cập nhật thất bại",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      // sku: "",
      name: "",
      barcode: "",
      categoryId: "",
      unit: "Cái",
      price: 0,
      description: "",
    });
    setImageUrl("");
    setImagePreview(null);
  };

  // Load product data for edit
  const loadProductData = (product: any) => {
    if (product) {
      setFormData({
        // sku: product.sku || "",
        name: product.name || "",
        barcode: product.barcode || "",
        categoryId: String(product.categoryId || ""),
        unit: product.unit || "Cái",
        price: product.price || 0,
        description: product.description || "",
      });

      // Set image from product
      if (product.imageUrl) {
        setImageUrl(product.imageUrl);
        try {
          new URL(product.imageUrl);
          setImagePreview(product.imageUrl);
        } catch {
          // If not a valid URL, create preview from server
          const fullImageUrl = product.imageUrl.startsWith("http")
            ? product.imageUrl
            : `http://localhost:8080${product.imageUrl}`;
          setImagePreview(fullImageUrl);
        }
      } else {
        setImageUrl("");
        setImagePreview(null);
      }
    }
  };

  return {
    // States
    formData,
    setFormData,
    isSubmitting,
    uploadMethod,
    setUploadMethod,
    imageUrl,
    imagePreview,
    fileInputRef,

    // Handlers
    handleUrlChange,
    clearImage,
    createProduct,
    updateProduct,
    resetForm,
    loadProductData,
  };
}
