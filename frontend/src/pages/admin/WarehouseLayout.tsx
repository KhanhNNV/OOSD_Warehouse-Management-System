import { useState } from "react";
import { Plus, Search, Edit, Trash2, QrCode, Printer, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zone, Shelf } from "@/types/wms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";

const mockZones: Zone[] = [
  { id: "1", code: "A", name: "Zone A - Điện tử", description: "Khu vực lưu trữ thiết bị điện tử", shelfCount: 12, createdAt: "2024-01-01T08:00:00Z" },
  { id: "2", code: "B", name: "Zone B - Máy tính", description: "Khu vực lưu trữ laptop, PC", shelfCount: 8, createdAt: "2024-01-01T08:00:00Z" },
  { id: "3", code: "C", name: "Zone C - Phụ kiện", description: "Khu vực lưu trữ phụ kiện", shelfCount: 20, createdAt: "2024-01-01T08:00:00Z" },
  { id: "4", code: "D", name: "Zone D - Linh kiện", description: "Khu vực lưu trữ linh kiện", shelfCount: 15, createdAt: "2024-01-01T08:00:00Z" },
];

const mockShelves: Shelf[] = [
  { id: "1", zoneId: "1", code: "A-01-01", name: "Kệ A-01-01", capacity: 100, currentStock: 85 },
  { id: "2", zoneId: "1", code: "A-01-02", name: "Kệ A-01-02", capacity: 100, currentStock: 42 },
  { id: "3", zoneId: "1", code: "A-02-01", name: "Kệ A-02-01", capacity: 80, currentStock: 80 },
  { id: "4", zoneId: "2", code: "B-01-01", name: "Kệ B-01-01", capacity: 50, currentStock: 35 },
  { id: "5", zoneId: "2", code: "B-01-02", name: "Kệ B-01-02", capacity: 50, currentStock: 12 },
  { id: "6", zoneId: "3", code: "C-01-01", name: "Kệ C-01-01", capacity: 200, currentStock: 156 },
];

export default function WarehouseLayoutPage() {
  const [zones, setZones] = useState<Zone[]>(mockZones);
  const [shelves, setShelves] = useState<Shelf[]>(mockShelves);
  const [searchTerm, setSearchTerm] = useState("");
  const [isZoneDialogOpen, setIsZoneDialogOpen] = useState(false);
  const [isShelfDialogOpen, setIsShelfDialogOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [newZone, setNewZone] = useState({ code: "", name: "", description: "" });
  const [newShelf, setNewShelf] = useState({ zoneId: "", code: "", name: "", capacity: 100 });

  const filteredZones = zones.filter(
    (zone) =>
      zone.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      zone.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredShelves = shelves.filter((shelf) =>
    selectedZone ? shelf.zoneId === selectedZone.id : true
  );

  const handleCreateZone = () => {
    const zone: Zone = {
      id: String(zones.length + 1),
      ...newZone,
      shelfCount: 0,
      createdAt: new Date().toISOString(),
    };
    setZones([...zones, zone]);
    setIsZoneDialogOpen(false);
    setNewZone({ code: "", name: "", description: "" });
    toast({
      title: "Tạo khu vực thành công",
      description: `Đã tạo ${zone.name}`,
    });
  };

  const handleCreateShelf = () => {
    const shelf: Shelf = {
      id: String(shelves.length + 1),
      ...newShelf,
      currentStock: 0,
    };
    setShelves([...shelves, shelf]);
    setIsShelfDialogOpen(false);
    setNewShelf({ zoneId: "", code: "", name: "", capacity: 100 });
    toast({
      title: "Tạo kệ hàng thành công",
      description: `Đã tạo ${shelf.name}`,
    });
  };

  const handlePrintQR = (shelf: Shelf) => {
    toast({
      title: "Đang tạo mã QR",
      description: `Đang xuất file PDF mã QR cho ${shelf.code}`,
    });
  };

  const handlePrintAllQR = () => {
    toast({
      title: "Đang tạo mã QR",
      description: `Đang xuất file PDF mã QR cho ${filteredShelves.length} kệ hàng`,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Cấu trúc Kho"
        description="Thiết lập khu vực, kệ hàng và in mã QR"
      />

      <Tabs defaultValue="zones" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="zones">Khu vực (Zone)</TabsTrigger>
          <TabsTrigger value="shelves">Kệ hàng (Shelf)</TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mã khu vực..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsZoneDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm khu vực
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredZones.map((zone) => (
              <Card
                key={zone.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => setSelectedZone(zone)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{zone.code}</CardTitle>
                        <p className="text-sm text-muted-foreground">{zone.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{zone.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Số kệ:</span>
                    <span className="font-semibold">{zone.shelfCount}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Shelves Tab */}
        <TabsContent value="shelves" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã kệ..."
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={handlePrintAllQR}>
              <Printer className="w-4 h-4 mr-2" />
              In tất cả QR
            </Button>
            <Button onClick={() => setIsShelfDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm kệ hàng
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead className="font-semibold">Mã kệ</TableHead>
                  <TableHead className="font-semibold">Tên kệ</TableHead>
                  <TableHead className="font-semibold">Khu vực</TableHead>
                  <TableHead className="font-semibold">Sức chứa</TableHead>
                  <TableHead className="font-semibold">Tình trạng</TableHead>
                  <TableHead className="font-semibold w-[150px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShelves.map((shelf) => {
                  const zone = zones.find((z) => z.id === shelf.zoneId);
                  const usagePercent = Math.round((shelf.currentStock / shelf.capacity) * 100);
                  return (
                    <TableRow key={shelf.id} className="hover:bg-table-row-hover transition-colors">
                      <TableCell className="font-mono font-medium">{shelf.code}</TableCell>
                      <TableCell>{shelf.name}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 rounded bg-muted text-sm">
                          {zone?.code}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-muted-foreground">
                          {shelf.currentStock}/{shelf.capacity}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Progress value={usagePercent} className="h-2" />
                          <span className="text-sm text-muted-foreground">
                            {usagePercent}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePrintQR(shelf)}
                            title="In mã QR"
                          >
                            <QrCode className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Sửa">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" title="Xóa">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Zone Dialog */}
      <Dialog open={isZoneDialogOpen} onOpenChange={setIsZoneDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm khu vực mới</DialogTitle>
            <DialogDescription>
              Tạo khu vực lưu trữ mới trong kho.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-code">Mã khu vực</Label>
                <Input
                  id="zone-code"
                  value={newZone.code}
                  onChange={(e) => setNewZone({ ...newZone, code: e.target.value })}
                  placeholder="A, B, C..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zone-name">Tên khu vực</Label>
                <Input
                  id="zone-name"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  placeholder="Zone A - Điện tử"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="zone-desc">Mô tả</Label>
              <Input
                id="zone-desc"
                value={newZone.description}
                onChange={(e) => setNewZone({ ...newZone, description: e.target.value })}
                placeholder="Mô tả khu vực..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsZoneDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateZone}>Tạo khu vực</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Shelf Dialog */}
      <Dialog open={isShelfDialogOpen} onOpenChange={setIsShelfDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm kệ hàng mới</DialogTitle>
            <DialogDescription>
              Tạo kệ hàng mới trong khu vực đã chọn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="shelf-zone">Khu vực</Label>
              <select
                id="shelf-zone"
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2"
                value={newShelf.zoneId}
                onChange={(e) => setNewShelf({ ...newShelf, zoneId: e.target.value })}
              >
                <option value="">Chọn khu vực</option>
                {zones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.code} - {zone.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shelf-code">Mã kệ</Label>
                <Input
                  id="shelf-code"
                  value={newShelf.code}
                  onChange={(e) => setNewShelf({ ...newShelf, code: e.target.value })}
                  placeholder="A-01-01"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shelf-capacity">Sức chứa</Label>
                <Input
                  id="shelf-capacity"
                  type="number"
                  value={newShelf.capacity}
                  onChange={(e) => setNewShelf({ ...newShelf, capacity: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="shelf-name">Tên kệ</Label>
              <Input
                id="shelf-name"
                value={newShelf.name}
                onChange={(e) => setNewShelf({ ...newShelf, name: e.target.value })}
                placeholder="Kệ A-01-01"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShelfDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateShelf}>Tạo kệ hàng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
