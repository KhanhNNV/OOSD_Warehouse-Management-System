import { Supplier, Product } from "@/types/wms";
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
import { Loader2 } from "lucide-react";

interface SupplierTabProps {
  suppliers: Supplier[];
  products: Product[];
  isLoading: boolean;
  onDelete: (id: number) => void;
  onEdit: (supplier: Supplier) => void;
}

export function SupplierTab({
  suppliers,
  products,
  isLoading,
  onDelete,
  onEdit,
}: SupplierTabProps) {
  const getProductCount = (supplierId: number) => {
    return products.filter((p) => p.supplierId === supplierId).length;
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Mã NCC</TableHead>
            <TableHead className="font-semibold">Tên</TableHead>
            <TableHead className="font-semibold">Email / SĐT</TableHead>
            <TableHead className="font-semibold">Địa chỉ</TableHead>
            <TableHead className="font-semibold">Số SP</TableHead>
            <TableHead className="font-semibold">Trạng thái</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center h-24">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : suppliers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center h-24 text-muted-foreground"
              >
                Không tìm thấy nhà cung cấp nào.
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">
                  {s.code || `SUP-${s.id}`}
                </TableCell>
                <TableCell className="font-medium">{s.name}</TableCell>
                <TableCell>
                  <div className="text-sm">{s.email}</div>
                  <div className="text-xs text-muted-foreground">{s.phone}</div>
                </TableCell>
                <TableCell className="font-medium">
                  {/* <div>{s.contactPerson || "---"}</div> */}
                  <div className="text-xs text-muted-foreground">
                    {s.address || "---"}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {getProductCount(s.id)} sản phẩm
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    Active
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(s)}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(s.id)}
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
