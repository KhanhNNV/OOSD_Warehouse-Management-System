import { Category, Product } from "./wms";

export interface ProductScanResponse {
    productId: string;
    sku: string;
    productName: string;
    imageProduct: string;
    barcode: string;
    unit: string;
}

export interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  onSuccess: () => void;
}

export interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSuccess: () => void;
}
