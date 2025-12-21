import { useState } from "react";
import { Search, Filter, Download, Eye, FileText, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PurchaseInvoice, SalesInvoice, InventoryValue } from "@/types/wms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { toast } from "@/hooks/use-toast";

const mockPurchaseInvoices: PurchaseInvoice[] = [
  { id: "1", invoiceNumber: "PI-2024-001", poNumber: "PO-2024-001", supplierName: "Samsung Vietnam", totalAmount: 150000000, status: "paid", dueDate: "2024-11-15T00:00:00Z", createdAt: "2024-10-14T08:00:00Z" },
  { id: "2", invoiceNumber: "PI-2024-002", poNumber: "PO-2024-002", supplierName: "Apple Vietnam", totalAmount: 280000000, status: "pending", dueDate: "2024-11-20T00:00:00Z", createdAt: "2024-10-13T08:00:00Z" },
  { id: "3", invoiceNumber: "PI-2024-003", poNumber: "PO-2024-003", supplierName: "Dell Technologies", totalAmount: 135000000, status: "overdue", dueDate: "2024-10-10T00:00:00Z", createdAt: "2024-09-25T08:00:00Z" },
];

const mockSalesInvoices: SalesInvoice[] = [
  { id: "1", invoiceNumber: "SI-2024-001", orderNumber: "SO-2024-001", customerName: "Công ty ABC", totalAmount: 85000000, status: "paid", dueDate: "2024-10-30T00:00:00Z", createdAt: "2024-10-14T08:00:00Z" },
  { id: "2", invoiceNumber: "SI-2024-002", orderNumber: "SO-2024-002", customerName: "Shop XYZ", totalAmount: 42000000, status: "pending", dueDate: "2024-11-05T00:00:00Z", createdAt: "2024-10-14T09:00:00Z" },
  { id: "3", invoiceNumber: "SI-2024-003", orderNumber: "SO-2024-003", customerName: "FPT Shop", totalAmount: 156000000, status: "paid", dueDate: "2024-10-25T00:00:00Z", createdAt: "2024-10-10T08:00:00Z" },
];

const mockInventoryValue: InventoryValue[] = [
  { category: "Điện thoại", totalQty: 230, totalValue: 5980000000, averagePrice: 26000000 },
  { category: "Laptop", totalQty: 65, totalValue: 3120000000, averagePrice: 48000000 },
  { category: "Phụ kiện", totalQty: 460, totalValue: 1380000000, averagePrice: 3000000 },
  { category: "Linh kiện", totalQty: 890, totalValue: 445000000, averagePrice: 500000 },
];

const statusColors = {
  paid: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  overdue: "bg-destructive/10 text-destructive",
};

const statusLabels = {
  paid: "Đã thanh toán",
  pending: "Chờ thanh toán",
  overdue: "Quá hạn",
};

export default function FinancePage() {
  const [searchTerm, setSearchTerm] = useState("");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatFullCurrency = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleExport = (type: string) => {
    toast({
      title: "Đang xuất báo cáo",
      description: `Đang tạo file Excel ${type}...`,
    });
  };

  const totalPayable = mockPurchaseInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalReceivable = mockSalesInvoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);

  const totalInventoryValue = mockInventoryValue.reduce(
    (sum, item) => sum + item.totalValue,
    0
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Tài chính & Chứng từ"
        description="Quản lý hóa đơn nhập/xuất và báo cáo giá trị kho"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Công nợ phải trả"
          value={formatCurrency(totalPayable)}
          icon={DollarSign}
          variant="warning"
        />
        <StatCard
          title="Công nợ phải thu"
          value={formatCurrency(totalReceivable)}
          icon={TrendingUp}
          variant="info"
        />
        <StatCard
          title="Giá trị tồn kho"
          value={formatCurrency(totalInventoryValue)}
          icon={FileText}
          variant="success"
        />
        <StatCard
          title="Hóa đơn quá hạn"
          value={mockPurchaseInvoices.filter((inv) => inv.status === "overdue").length + mockSalesInvoices.filter((inv) => inv.status === "overdue").length}
          icon={AlertCircle}
          variant="warning"
        />
      </div>

      <Tabs defaultValue="purchase" className="space-y-6">
        <TabsList className="bg-muted">
          <TabsTrigger value="purchase">Hóa đơn Nhập kho</TabsTrigger>
          <TabsTrigger value="sales">Hóa đơn Xuất kho</TabsTrigger>
          <TabsTrigger value="inventory-value">Giá trị Tồn kho</TabsTrigger>
        </TabsList>

        {/* Purchase Invoices Tab */}
        <TabsContent value="purchase" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hóa đơn, nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
            <Button variant="outline" onClick={() => handleExport("hóa đơn nhập")}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead className="font-semibold">Số HĐ</TableHead>
                  <TableHead className="font-semibold">Mã PO</TableHead>
                  <TableHead className="font-semibold">Nhà cung cấp</TableHead>
                  <TableHead className="font-semibold text-right">Số tiền</TableHead>
                  <TableHead className="font-semibold">Hạn thanh toán</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockPurchaseInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-table-row-hover transition-colors">
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.poNumber}</TableCell>
                    <TableCell>{invoice.supplierName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatFullCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Sales Invoices Tab */}
        <TabsContent value="sales" className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo mã hóa đơn, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Bộ lọc
            </Button>
            <Button variant="outline" onClick={() => handleExport("hóa đơn xuất")}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>

          <div className="bg-card rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-table-header hover:bg-table-header">
                  <TableHead className="font-semibold">Số HĐ</TableHead>
                  <TableHead className="font-semibold">Mã đơn hàng</TableHead>
                  <TableHead className="font-semibold">Khách hàng</TableHead>
                  <TableHead className="font-semibold text-right">Số tiền</TableHead>
                  <TableHead className="font-semibold">Hạn thanh toán</TableHead>
                  <TableHead className="font-semibold">Trạng thái</TableHead>
                  <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSalesInvoices.map((invoice) => (
                  <TableRow key={invoice.id} className="hover:bg-table-row-hover transition-colors">
                    <TableCell className="font-mono font-medium">{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.orderNumber}</TableCell>
                    <TableCell>{invoice.customerName}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatFullCurrency(invoice.totalAmount)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={statusColors[invoice.status]}>
                        {statusLabels[invoice.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Inventory Value Tab */}
        <TabsContent value="inventory-value" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Báo cáo Giá trị Tồn kho</h3>
              <p className="text-sm text-muted-foreground">
                Tổng giá trị tài sản hàng tồn kho theo danh mục
              </p>
            </div>
            <Button variant="outline" onClick={() => handleExport("giá trị tồn kho")}>
              <Download className="w-4 h-4 mr-2" />
              Xuất Excel
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Summary Card */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="text-base">Tổng quan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-primary/5 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">Tổng giá trị</p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(totalInventoryValue)}
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tổng số lượng</span>
                    <span className="font-semibold">
                      {mockInventoryValue.reduce((sum, item) => sum + item.totalQty, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Số danh mục</span>
                    <span className="font-semibold">{mockInventoryValue.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Inventory Value Table */}
            <div className="lg:col-span-2 bg-card rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-table-header hover:bg-table-header">
                    <TableHead className="font-semibold">Danh mục</TableHead>
                    <TableHead className="font-semibold text-right">Số lượng</TableHead>
                    <TableHead className="font-semibold text-right">Giá TB/SP</TableHead>
                    <TableHead className="font-semibold text-right">Tổng giá trị</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockInventoryValue.map((item, index) => (
                    <TableRow key={index} className="hover:bg-table-row-hover transition-colors">
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">
                        {item.totalQty.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatFullCurrency(item.averagePrice)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatFullCurrency(item.totalValue)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Tổng cộng</TableCell>
                    <TableCell className="text-right">
                      {mockInventoryValue.reduce((sum, item) => sum + item.totalQty, 0).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">-</TableCell>
                    <TableCell className="text-right text-primary">
                      {formatFullCurrency(totalInventoryValue)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
