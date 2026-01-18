import { Category, Product } from "@/types/wms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";

interface CategoryTabProps {
  categories: Category[];
  products: Product[];
  isLoading: boolean;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
}

export function CategoryTab({
  categories,
  products,
  isLoading,
  onEdit,
  onDelete,
}: CategoryTabProps) {
  const getProductCount = (categoryId: number) => {
    return products.filter((p) => {
      const pCategoryId = String(p.categoryId || "");
      const catId = String(categoryId);
      return pCategoryId === catId;
    }).length;
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">ID</TableHead>
            <TableHead className="font-semibold">Tên danh mục</TableHead>
            <TableHead className="font-semibold">Số sản phẩm</TableHead>
            <TableHead className="font-semibold">Mô tả</TableHead>
            <TableHead className="font-semibold">Ngày tạo</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center h-24 text-muted-foreground"
              >
                Không tìm thấy danh mục nào.
              </TableCell>
            </TableRow>
          ) : (
            categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-xs">{c.id}</TableCell>

                {/* ✅ Hiển thị Tên + Code inline */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    {c.code && (
                      <Badge
                        variant="outline"
                        className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200"
                      >
                        {c.code}
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge variant="secondary">{getProductCount(c.id)} SP</Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                  {c.description || "---"}
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {c.createdAt
                    ? new Date(c.createdAt).toLocaleDateString("vi-VN")
                    : "---"}
                </TableCell>

                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(c)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(c.id)}
                      disabled={getProductCount(c.id) > 0}
                      title={
                        getProductCount(c.id) > 0
                          ? "Không thể xóa danh mục có sản phẩm"
                          : "Xóa"
                      }
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
