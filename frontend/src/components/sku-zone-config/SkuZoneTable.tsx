import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ArrowRight } from "lucide-react";
import { SkuZoneConfig } from "@/types/skuZoneConfig";

interface SkuZoneTableProps {
  data: SkuZoneConfig[];
  loading: boolean;
  onEdit: (config: SkuZoneConfig) => void;
  onDelete: (id: number) => void;
}

export function SkuZoneTable({
  data,
  loading,
  onEdit,
  onDelete,
}: SkuZoneTableProps) {
  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Đang tải dữ liệu...</div>;
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12 border rounded-md bg-slate-50">
        <p className="text-muted-foreground">Chưa có cấu hình nào.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Mã Prefix (SKU)</TableHead>
            <TableHead>Quy tắc lưu trữ (Zone)</TableHead>
            <TableHead className="text-right">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-mono text-slate-500">#{item.id}</TableCell>
              <TableCell>
                <Badge variant="outline" className="text-base font-bold bg-slate-100">
                  {item.skuPrefix}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600 hover:bg-blue-700">
                    Zone {item.primaryZone}
                  </Badge>
                  {item.backupZone && (
                    <>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200">
                        Zone {item.backupZone}
                      </Badge>
                    </>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  onClick={() => onEdit(item)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => {
                    if (confirm(`Bạn có chắc muốn xóa cấu hình cho prefix ${item.skuPrefix}?`)) {
                      onDelete(item.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}