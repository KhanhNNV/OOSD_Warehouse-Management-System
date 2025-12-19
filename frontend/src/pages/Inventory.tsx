import { useState } from "react";
import { Search, Filter, Package, ArrowUpDown } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/types/wms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

const mockInventory: InventoryItem[] = [
  {
    id: "1",
    productId: "P001",
    productName: "iPhone 15 Pro Max 256GB",
    sku: "APL-IP15PM-256",
    physicalQty: 150,
    allocatedQty: 45,
    availableQty: 105,
    location: "A-01-02",
  },
  {
    id: "2",
    productId: "P002",
    productName: "Samsung Galaxy S24 Ultra",
    sku: "SAM-S24U-001",
    physicalQty: 80,
    allocatedQty: 30,
    availableQty: 50,
    location: "A-02-01",
  },
  {
    id: "3",
    productId: "P003",
    productName: "MacBook Pro 14 M3",
    sku: "APL-MBP14M3-001",
    physicalQty: 25,
    allocatedQty: 20,
    availableQty: 5,
    location: "B-01-01",
  },
  {
    id: "4",
    productId: "P004",
    productName: "Dell XPS 15 i7",
    sku: "DELL-XPS15-I7",
    physicalQty: 40,
    allocatedQty: 5,
    availableQty: 35,
    location: "B-02-03",
  },
  {
    id: "5",
    productId: "P005",
    productName: "AirPods Pro 2",
    sku: "APL-APP2-001",
    physicalQty: 200,
    allocatedQty: 80,
    availableQty: 120,
    location: "C-01-01",
  },
  {
    id: "6",
    productId: "P006",
    productName: "iPad Pro 12.9 M2",
    sku: "APL-IPADP-M2",
    physicalQty: 35,
    allocatedQty: 35,
    availableQty: 0,
    location: "A-03-02",
  },
  {
    id: "7",
    productId: "P007",
    productName: "Sony WH-1000XM5",
    sku: "SNY-WH1K-XM5",
    physicalQty: 60,
    allocatedQty: 15,
    availableQty: 45,
    location: "C-02-01",
  },
  {
    id: "8",
    productId: "P008",
    productName: "Logitech MX Master 3S",
    sku: "LGT-MXM-3S",
    physicalQty: 100,
    allocatedQty: 10,
    availableQty: 90,
    location: "D-01-02",
  },
];

export default function InventoryPage() {
  const [inventory] = useState<InventoryItem[]>(mockInventory);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"available" | "physical" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const handleSort = (column: "available" | "physical") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
  };

  const filteredInventory = inventory
    .filter(
      (item) =>
        item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortBy) return 0;
      const valueA = sortBy === "available" ? a.availableQty : a.physicalQty;
      const valueB = sortBy === "available" ? b.availableQty : b.physicalQty;
      return sortOrder === "asc" ? valueA - valueB : valueB - valueA;
    });

  const totalPhysical = inventory.reduce((sum, item) => sum + item.physicalQty, 0);
  const totalAllocated = inventory.reduce((sum, item) => sum + item.allocatedQty, 0);
  const totalAvailable = inventory.reduce((sum, item) => sum + item.availableQty, 0);
  const lowStockCount = inventory.filter((item) => item.availableQty <= 10).length;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Tồn kho"
        description="Theo dõi số lượng hàng hóa trong kho"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tổng tồn kho</p>
              <p className="text-2xl font-semibold">{totalPhysical.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-info/10">
              <Package className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đã phân bổ</p>
              <p className="text-2xl font-semibold">{totalAllocated.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Package className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Có thể xuất</p>
              <p className="text-2xl font-semibold">{totalAvailable.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-warning/10">
              <Package className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sắp hết hàng</p>
              <p className="text-2xl font-semibold">{lowStockCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên sản phẩm, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Inventory Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Sản phẩm</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold">Vị trí</TableHead>
              <TableHead className="font-semibold text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("physical")}
                  className="gap-1 -mr-3"
                >
                  SL Thực tế
                  <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
              <TableHead className="font-semibold text-right">Đã phân bổ</TableHead>
              <TableHead className="font-semibold text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("available")}
                  className="gap-1 -mr-3"
                >
                  Có thể xuất
                  <ArrowUpDown className="w-3 h-3" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  "hover:bg-table-row-hover transition-colors",
                  item.availableQty === 0 && "bg-destructive/5",
                  item.availableQty > 0 && item.availableQty <= 10 && "bg-warning/5"
                )}
              >
                <TableCell className="font-medium">{item.productName}</TableCell>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded bg-muted text-sm font-medium">
                    {item.location}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">{item.physicalQty}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {item.allocatedQty}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      item.availableQty === 0 && "text-destructive",
                      item.availableQty > 0 && item.availableQty <= 10 && "text-warning",
                      item.availableQty > 10 && "text-success"
                    )}
                  >
                    {item.availableQty}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/20" />
          <span>Hết hàng</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning/20" />
          <span>Sắp hết (≤10)</span>
        </div>
      </div>
    </div>
  );
}
