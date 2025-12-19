import { useState } from "react";
import { RefreshCw, Check, AlertTriangle, Filter, Search } from "lucide-react";
import { StocktakeItem } from "@/types/wms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface StocktakeVarianceTableProps {
  items: StocktakeItem[];
  onRecount: (itemId: string) => void;
  onApprove: (itemId: string) => void;
}

const statusLabels: Record<StocktakeItem["status"], string> = {
  pending: "Chờ đếm",
  counted: "Đã đếm",
  recount: "Đếm lại",
  approved: "Đã duyệt",
  adjusted: "Đã điều chỉnh",
};

const statusColors: Record<StocktakeItem["status"], string> = {
  pending: "text-muted-foreground",
  counted: "text-info",
  recount: "text-warning",
  approved: "text-success",
  adjusted: "text-primary",
};

export function StocktakeVarianceTable({
  items,
  onRecount,
  onApprove,
}: StocktakeVarianceTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showVarianceOnly, setShowVarianceOnly] = useState(false);

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || item.status === filterStatus;
    const matchesVariance = !showVarianceOnly || (item.variance !== null && item.variance !== 0);
    return matchesSearch && matchesStatus && matchesVariance;
  });

  const hasVariance = (item: StocktakeItem) => item.variance !== null && item.variance !== 0;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Lọc theo trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="pending">Chờ đếm</SelectItem>
            <SelectItem value="counted">Đã đếm</SelectItem>
            <SelectItem value="recount">Đếm lại</SelectItem>
            <SelectItem value="approved">Đã duyệt</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showVarianceOnly ? "default" : "outline"}
          onClick={() => setShowVarianceOnly(!showVarianceOnly)}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Chỉ hiện chênh lệch
        </Button>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow className="bg-table-header hover:bg-table-header">
            <TableHead className="font-semibold">Sản phẩm</TableHead>
            <TableHead className="font-semibold">SKU</TableHead>
            <TableHead className="font-semibold">Vị trí</TableHead>
            <TableHead className="font-semibold text-right">SL Hệ thống</TableHead>
            <TableHead className="font-semibold text-right">SL Thực tế</TableHead>
            <TableHead className="font-semibold text-right">Chênh lệch</TableHead>
            <TableHead className="font-semibold">Trạng thái</TableHead>
            <TableHead className="font-semibold w-[200px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredItems.map((item) => (
            <TableRow
              key={item.id}
              className={cn(
                "transition-colors",
                hasVariance(item) && item.status !== "approved" && item.status !== "adjusted"
                  ? "bg-variance-bg/50 hover:bg-variance-bg border-l-4 border-l-variance-border"
                  : "hover:bg-table-row-hover"
              )}
            >
              <TableCell>
                <div>
                  <p className="font-medium">{item.productName}</p>
                  {item.countedBy && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Đếm bởi: {item.countedBy}
                    </p>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-sm">{item.sku}</TableCell>
              <TableCell>{item.location}</TableCell>
              <TableCell className="text-right font-medium">{item.systemQty}</TableCell>
              <TableCell className="text-right font-medium">
                {item.actualQty !== null ? item.actualQty : "-"}
              </TableCell>
              <TableCell className="text-right">
                {item.variance !== null ? (
                  <span
                    className={cn(
                      "font-semibold",
                      item.variance > 0 ? "text-success" : item.variance < 0 ? "text-destructive" : ""
                    )}
                  >
                    {item.variance > 0 ? "+" : ""}
                    {item.variance}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell>
                <span className={cn("text-sm font-medium", statusColors[item.status])}>
                  {statusLabels[item.status]}
                </span>
              </TableCell>
              <TableCell>
                {hasVariance(item) && item.status === "counted" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRecount(item.id)}
                      className="gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Đếm lại
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApprove(item.id)}
                      className="gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Duyệt
                    </Button>
                  </div>
                )}
                {item.status === "recount" && (
                  <span className="text-sm text-warning">Đang chờ đếm lại...</span>
                )}
                {item.status === "approved" && (
                  <span className="text-sm text-success flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Đã duyệt điều chỉnh
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredItems.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          Không tìm thấy sản phẩm nào phù hợp với bộ lọc.
        </div>
      )}
    </div>
  );
}
