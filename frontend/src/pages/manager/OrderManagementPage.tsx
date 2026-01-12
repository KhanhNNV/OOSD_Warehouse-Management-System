import { useState } from "react";
import {
  Plus,
  Upload,
  Search,
  Filter,
  RotateCcw,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useOrderManagement } from "@/hooks/useOrderManagement";
import { OrderListTable } from "@/components/ordermanagement/OrderListTable";
import { CreateOrderDialog } from "@/components/ordermanagement/CreateOrderDialog";
import { ImportExcelDialog } from "@/components/ordermanagement/ImportExcelDialog";
import { OrderDetailDialog } from "@/components/ordermanagement/OrderDetailDialog";
import { StatsCards } from "@/components/ordermanagement/StatsCards";
import { OutboundOrder } from "@/types/outboundordermanagement";

export default function OrderManagementPage() {
  const {
    orders,
    customers,
    products,
    stats,
    isLoading,
    isSubmitting,
    filterStatus,
    setFilterStatus,
    filterCustomerId,
    setFilterCustomerId,
    filterFromDate,
    setFilterFromDate,
    filterToDate,
    setFilterToDate,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,
    handleCreateOrder,
    handleImportExcel,
    handleConfirmOrder,
    handleCancelOrder,
    resetFilters,
  } = useOrderManagement();

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OutboundOrder | null>(
    null
  );

  const handleViewDetail = (order: OutboundOrder) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const handleCancelWithReason = (orderId: number) => {
    const reason = prompt("Lý do hủy đơn:");
    if (reason) {
      handleCancelOrder(orderId, reason);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader
          title="Quản lý đơn xuất kho"
          description="Quản lý và theo dõi các đơn hàng xuất kho"
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Excel
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo đơn mới
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Bộ lọc</h3>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <Label>Tìm kiếm</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Mã đơn, tên KH, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <Label>Trạng thái</Label>
            <Select
              value={filterStatus || "all"}
              onValueChange={(value) =>
                setFilterStatus(value === "all" ? undefined : value as any)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="NEW">Mới</SelectItem>
                <SelectItem value="ALLOCATED">Đã phân bổ</SelectItem>
                <SelectItem value="PICKING">Đang lấy hàng</SelectItem>
                <SelectItem value="PACKED">Đã đóng gói</SelectItem>
                <SelectItem value="SHIPPED">Đã giao vận</SelectItem>
                <SelectItem value="COMPLETED">Hoàn thành</SelectItem>
                <SelectItem value="CANCELLED">Đã hủy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Filter */}
          <div>
            <Label>Khách hàng</Label>
            <Select
              value={filterCustomerId?.toString() || "all"}
              onValueChange={(value) =>
                setFilterCustomerId(value === "all" ? undefined : parseInt(value))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Tất cả" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label>Khoảng thời gian</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full mt-1 justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  {filterFromDate && filterToDate
                    ? `${filterFromDate} - ${filterToDate}`
                    : "Chọn ngày"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-4">
                <div className="space-y-4">
                  <div>
                    <Label>Từ ngày</Label>
                    <Input
                      type="datetime-local"
                      value={filterFromDate}
                      onChange={(e) => setFilterFromDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Đến ngày</Label>
                    <Input
                      type="datetime-local"
                      value={filterToDate}
                      onChange={(e) => setFilterToDate(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          Hiển thị {orders.length} / {totalElements} đơn hàng
        </p>
        {totalPages > 1 && (
          <p>
            Trang {currentPage + 1} / {totalPages}
          </p>
        )}
      </div>

      {/* Table */}
      <OrderListTable
        orders={orders}
        isLoading={isLoading}
        onViewDetail={handleViewDetail}
        onConfirm={handleConfirmOrder}
        onCancel={handleCancelWithReason}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 0}
          >
            Trước
          </Button>
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <Button
                key={i}
                variant={currentPage === i ? "default" : "outline"}
                onClick={() => setCurrentPage(i)}
                size="sm"
              >
                {i + 1}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
          >
            Sau
          </Button>
        </div>
      )}

      {/* Dialogs */}
      <CreateOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        customers={customers}
        products={products}
        onSubmit={handleCreateOrder}
        isSubmitting={isSubmitting}
      />

      <ImportExcelDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        customers={customers}
        onSubmit={handleImportExcel}
        isSubmitting={isSubmitting}
      />

      <OrderDetailDialog
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
        order={selectedOrder}
      />
    </div>
  );
}
