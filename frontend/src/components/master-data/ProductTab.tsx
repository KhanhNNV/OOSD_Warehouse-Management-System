import { Product } from "@/types/wms";
import { masterService } from "@/services/master.service";
import { ImageIcon, Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface ProductTabProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onEdit: (product: Product) => void;
}

export function ProductTab({
  products,
  isLoading,
  onDelete,
  onEdit,
}: ProductTabProps) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  const getImageUrl = (imageUrl: string | undefined): string => {
    if (!imageUrl) return "";

    console.log("Processing image URL:", imageUrl);

    // Nếu đã là full URL
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Nếu là đường dẫn tương đối với /api/uploads/
    if (imageUrl.includes("api/uploads")) {
      // Kiểm tra xem đã có domain chưa
      if (!imageUrl.startsWith("http")) {
        return `http://localhost:8080${
          imageUrl.startsWith("/") ? "" : "/"
        }${imageUrl}`;
      }
      return imageUrl;
    }

    // Nếu chỉ là tên file
    if (!imageUrl.startsWith("/")) {
      return `http://localhost:8080/api/uploads/${imageUrl}`;
    }

    // Mặc định
    return `http://localhost:8080${imageUrl}`;
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[50px]">Ảnh</TableHead>
            <TableHead className="font-semibold">SKU / Barcode</TableHead>
            <TableHead className="font-semibold">Tên sản phẩm</TableHead>
            <TableHead className="font-semibold">Danh mục</TableHead>
            <TableHead className="font-semibold">Đơn vị</TableHead>
            <TableHead className="font-semibold text-right">Giá</TableHead>
            <TableHead className="font-semibold w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                <Loader2 className="animate-spin inline mr-2" />
                Đang tải...
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center h-24 text-muted-foreground"
              >
                Không tìm thấy sản phẩm nào.
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <TableRow key={p.id} className="hover:bg-muted/50">
                {/* <TableCell>
                  {p.imageUrl ? (
                    <img
                      // src={`http://localhost:8080${p.imageUrl}`}
                      src={
                        p.imageUrl.startsWith("http")
                          ? p.imageUrl
                          : `http://localhost:8080/api/uploads/${p.imageUrl}`
                      }
                      alt=""
                      className="w-8 h-8 rounded object-cover border"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon size={16} />
                    </div>
                  )}
                </TableCell> */}

                <TableCell>
                  {p.imageUrl ? (
                    <img
                      src={getImageUrl(p.imageUrl)}
                      alt={p.name}
                      className="w-10 h-10 rounded object-cover border"
                      onError={(e) => {
                        console.error(
                          `Failed to load image for ${p.sku}:`,
                          p.imageUrl
                        );
                        (e.target as HTMLImageElement).src =
                          "/placeholder-image.png";
                        (
                          e.target as HTMLImageElement
                        ).alt = `Ảnh không tải được: ${p.name}`;
                      }}
                      onLoad={() =>
                        console.log(`Image loaded for ${p.sku}:`, p.imageUrl)
                      }
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="font-mono text-sm font-medium text-primary">
                    {p.sku}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.barcode || "Chưa có barcode"}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <div>{p.name}</div>
                  {/* {p.description && (
                    <div className="text-xs text-muted-foreground truncate max-w-xs">
                      {p.description}
                    </div>
                  )} */}
                </TableCell>
                <TableCell className="font-medium">
                  <div>{p.categoryName}</div>
                  {/* <Badge variant="outline">{p.name || "---"}</Badge> */}
                </TableCell>
                <TableCell>{p.unit}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(p.price || 0)}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        console.log("Edit button clicked for product:", p);
                        onEdit(p);
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(Number(p.id))}
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
