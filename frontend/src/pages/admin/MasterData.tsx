import { useState } from "react";
import { Plus, Search, Edit, Trash2, Package, Building2 } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Product, Supplier } from "@/types/wms";
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
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

const mockProducts: Product[] = [
  { id: "1", sku: "APL-IP15PM-256", name: "iPhone 15 Pro Max 256GB", category: "Điện thoại", unit: "Cái", costPrice: 28000000, createdAt: "2024-01-15T08:00:00Z" },
  { id: "2", sku: "SAM-S24U-001", name: "Samsung Galaxy S24 Ultra", category: "Điện thoại", unit: "Cái", costPrice: 32000000, createdAt: "2024-01-16T08:00:00Z" },
  { id: "3", sku: "APL-MBP14M3-001", name: "MacBook Pro 14 M3", category: "Laptop", unit: "Cái", costPrice: 52000000, createdAt: "2024-01-20T08:00:00Z" },
  { id: "4", sku: "DELL-XPS15-I7", name: "Dell XPS 15 i7", category: "Laptop", unit: "Cái", costPrice: 45000000, createdAt: "2024-02-01T08:00:00Z" },
  { id: "5", sku: "APL-APP2-001", name: "AirPods Pro 2", category: "Phụ kiện", unit: "Cái", costPrice: 6500000, createdAt: "2024-02-10T08:00:00Z" },
];

const mockSuppliers: Supplier[] = [
  { id: "1", code: "SUP-001", name: "Apple Vietnam", contactPerson: "Nguyễn Văn A", phone: "0901234567", email: "contact@apple.vn", address: "123 Lê Lợi, Q1, HCM", status: "active", createdAt: "2024-01-01T08:00:00Z" },
  { id: "2", code: "SUP-002", name: "Samsung Electronics", contactPerson: "Trần Thị B", phone: "0912345678", email: "contact@samsung.vn", address: "456 Nguyễn Huệ, Q1, HCM", status: "active", createdAt: "2024-01-02T08:00:00Z" },
  { id: "3", code: "SUP-003", name: "Dell Technologies", contactPerson: "Lê Văn C", phone: "0923456789", email: "contact@dell.vn", address: "789 Võ Văn Tần, Q3, HCM", status: "active", createdAt: "2024-01-03T08:00:00Z" },
  { id: "4", code: "SUP-004", name: "LG Electronics", contactPerson: "Phạm Thị D", phone: "0934567890", email: "contact@lg.vn", address: "321 CMT8, Q10, HCM", status: "inactive", createdAt: "2024-01-04T08:00:00Z" },
];

export default function MasterDataPage() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [suppliers, setSuppliers] = useState<Supplier[]>(mockSuppliers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    sku: "", name: "", category: "", unit: "Cái", costPrice: 0,
  });
  const [newSupplier, setNewSupplier] = useState({
    code: "", name: "", contactPerson: "", phone: "", email: "", address: "",
  });

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const handleCreateProduct = () => {
    const product: Product = {
      id: String(products.length + 1),
      ...newProduct,
      createdAt: new Date().toISOString(),
    };
    setProducts([product, ...products]);
    setIsProductDialogOpen(false);
    setNewProduct({ sku: "", name: "", category: "", unit: "Cái", costPrice: 0 });
    toast({
      title: "Tạo sản phẩm thành công",
      description: `Đã thêm ${product.name}`,
    });
  };

  const handleCreateSupplier = () => {
    const supplier: Supplier = {
      id: String(suppliers.length + 1),
      ...newSupplier,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setSuppliers([supplier, ...suppliers]);
    setIsSupplierDialogOpen(false);
    setNewSupplier({ code: "", name: "", contactPerson: "", phone: "", email: "", address: "" });
    toast({
      title: "Tạo nhà cung cấp thành công",
      description: `Đã thêm ${supplier.name}`,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Danh mục"
        description="Quản lý thông tin sản phẩm và nhà cung cấp"
      />

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Sản phẩm
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="gap-2">
            <Building2 className="w-4 h-4" />
            Nhà cung cấp
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsProductDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold">Tên sản phẩm</TableHead>
                  <TableHead className="font-semibold">Danh mục</TableHead>
                  <TableHead className="font-semibold">Đơn vị</TableHead>
                  <TableHead className="font-semibold text-right">Giá nhập</TableHead>
                  <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-table-row-hover transition-colors">
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.category}</Badge>
                    </TableCell>
                    <TableCell>{product.unit}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.costPrice)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên hoặc mã..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button onClick={() => setIsSupplierDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Thêm nhà cung cấp
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead className="font-semibold">Mã NCC</TableHead>
                  <TableHead className="font-semibold">Tên nhà cung cấp</TableHead>
                  <TableHead className="font-semibold">Người liên hệ</TableHead>
                  <TableHead className="font-semibold">Điện thoại</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-table-row-hover transition-colors">
                    <TableCell className="font-mono text-sm">{supplier.code}</TableCell>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson}</TableCell>
                    <TableCell>{supplier.phone}</TableCell>
                    <TableCell>{supplier.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={
                          supplier.status === "active"
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {supplier.status === "active" ? "Hoạt động" : "Ngừng HĐ"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Product Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm sản phẩm mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin sản phẩm mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-sku">SKU</Label>
                <Input
                  id="product-sku"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                  placeholder="APL-IP15-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Danh mục</Label>
                <Input
                  id="product-category"
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                  placeholder="Điện thoại"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-name">Tên sản phẩm</Label>
              <Input
                id="product-name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                placeholder="iPhone 15 Pro Max 256GB"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product-unit">Đơn vị tính</Label>
                <Input
                  id="product-unit"
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                  placeholder="Cái"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Giá nhập (VNĐ)</Label>
                <Input
                  id="product-price"
                  type="number"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateProduct}>Thêm sản phẩm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Supplier Dialog */}
      <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Thêm nhà cung cấp mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin nhà cung cấp mới vào hệ thống.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-code">Mã NCC</Label>
                <Input
                  id="supplier-code"
                  value={newSupplier.code}
                  onChange={(e) => setNewSupplier({ ...newSupplier, code: e.target.value })}
                  placeholder="SUP-001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-name">Tên nhà cung cấp</Label>
                <Input
                  id="supplier-name"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  placeholder="Apple Vietnam"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="supplier-contact">Người liên hệ</Label>
                <Input
                  id="supplier-contact"
                  value={newSupplier.contactPerson}
                  onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier-phone">Điện thoại</Label>
                <Input
                  id="supplier-phone"
                  value={newSupplier.phone}
                  onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-email">Email</Label>
              <Input
                id="supplier-email"
                type="email"
                value={newSupplier.email}
                onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                placeholder="contact@supplier.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier-address">Địa chỉ</Label>
              <Input
                id="supplier-address"
                value={newSupplier.address}
                onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                placeholder="123 Lê Lợi, Q1, HCM"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateSupplier}>Thêm nhà cung cấp</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
