import { useState, useEffect } from "react";
import { PurchaseOrder } from "@/types/inbound";
import { inboundService, Supplier } from "@/services/inbound.service";
import { toast } from "@/hooks/use-toast";

export function useInbound() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  // Load suppliers & orders on mount
  useEffect(() => {
    Promise.all([
      inboundService
        .getPOs()
        .then((data) => {
          const list: PurchaseOrder[] = Array.isArray(data)
            ? data
            : data?.data ?? [];
          setOrders(list);
        })
        .catch((err) => {
          toast({
            title: "Lỗi",
            description: "Không tải được đơn hàng",
            variant: "destructive",
          });
          console.error("getPOs error", err);
        }),
      inboundService
        .getSuppliers()
        .then((data) => {
          const list: Supplier[] = Array.isArray(data)
            ? data
            : data?.data ?? [];
          setSuppliers(list);
        })
        .catch((err) => {
          toast({
            title: "Lỗi",
            description: "Không tải được NCC",
            variant: "destructive",
          });
          console.error("getSuppliers error", err);
        }),
    ]).finally(() => setIsLoading(false));
  }, []);

  const handleFileUpload = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file Excel",
        variant: "destructive",
      });
      return;
    }
    const newPO: PurchaseOrder = {
      id: Math.random().toString(),
      poNumber: `PO-EXCEL-${Date.now().toString().slice(-4)}`,
      supplierName: "NCC từ Excel",
      status: "NEW",
      createdAt: new Date().toISOString(),
      expectedDate: new Date().toISOString(),
      totalItems: 50,
      receivedItems: 0,
      hasVariance: false,
    };
    setOrders([newPO, ...orders]);
    toast({ title: "Thành công", description: "Đã nhập đơn hàng từ file" });
  };

  const handleUploadPO = (
    file: File,
    supplierId: string,
    onSuccess: () => void
  ) => {
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: "Lỗi",
        description: "Chỉ chấp nhận file Excel",
        variant: "destructive",
      });
      return;
    }
    setIsUploading(true);

    // Tìm tên NCC từ ID
    const supplier = suppliers.find((s) => String(s.id) === supplierId);
    const newPO: PurchaseOrder = {
      id: Math.random().toString(),
      poNumber: `PO-${Date.now().toString().slice(-6)}`,
      supplierName: supplier?.name || "NCC",
      status: "NEW",
      createdAt: new Date().toISOString(),
      expectedDate: new Date().toISOString(),
      totalItems: 50,
      receivedItems: 0,
      hasVariance: false,
    };

    setOrders([newPO, ...orders]);
    setIsUploading(false);
    toast({ title: "Thành công", description: "Đã tạo đơn nhập từ file" });
    onSuccess();
  };

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filteredOrders = safeOrders.filter(
    (po) =>
      po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    orders: filteredOrders,
    suppliers,
    searchTerm,
    setSearchTerm,
    isLoading,
    isUploading,
    handleFileUpload,
    handleUploadPO,
  };
}
