import { useState, useEffect, useMemo, useCallback } from "react";
import {
  OutboundOrder,
  OutboundOrderFilterParams,
  Customer,
  Product,
  OrderStatus,
  CreateOutboundOrderRequest,
  OutboundStats,
} from "@/types/outboundordermanagement";
import { orderManagementService } from "@/services/ordermanagement.service";
import { toast } from "@/hooks/use-toast";
import {toastError} from "@/components/common/toastError.tsx";

export function useOrderManagement() {
  // State với default values là array rỗng
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<OutboundStats | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [filterStatus, setFilterStatus] = useState<OrderStatus | undefined>(
    undefined
  );
  const [filterCustomerId, setFilterCustomerId] = useState<number | undefined>(
    undefined
  );
  const [filterFromDate, setFilterFromDate] = useState<string>("");
  const [filterToDate, setFilterToDate] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  /**
   * Fetch danh sách đơn hàng
   */
  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);

      const params: OutboundOrderFilterParams = {
        status: filterStatus,
        customerId: filterCustomerId,
        fromDate: filterFromDate,
        toDate: filterToDate,
        page: currentPage,
        size: pageSize,
      };

      const response = await orderManagementService.getOrders(params);

      setOrders(Array.isArray(response.content) ? response.content : []);
      setTotalPages(response.totalPages || 0);
      setTotalElements(response.totalElements || 0);

      console.log("Orders loaded:", response.content?.length || 0);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách đơn hàng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    filterStatus,
    filterCustomerId,
    filterFromDate,
    filterToDate,
    currentPage,
  ]);

  /**
   * Fetch master data (customers, products)
   */
  const fetchMasterData = async () => {
    try {
      console.log("Fetching master data...");

      // Fetch customers
      try {
        const customersData = await orderManagementService.getCustomers();
        console.log("Customers received:", customersData);

        if (Array.isArray(customersData)) {
          setCustomers(customersData);
          console.log(`Set ${customersData.length} customers to state`);
        } else {
          console.error("Customers is not an array:", customersData);
          setCustomers([]);
          toast({
            title: "Cảnh báo",
            description: "Dữ liệu khách hàng không đúng định dạng",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to load customers:", error);
        setCustomers([]);
        toast({
          title: "Cảnh báo",
          description: "Không thể tải danh sách khách hàng",
          variant: "destructive",
        });
      }

      // Fetch products
      try {
        const productsData = await orderManagementService.getProducts();
        console.log("Products received:", productsData);

        if (Array.isArray(productsData)) {
          setProducts(productsData);
          console.log(`Set ${productsData.length} products to state`);
        } else {
          console.error("Products is not an array:", productsData);
          setProducts([]);
          toast({
            title: "Cảnh báo",
            description: "Dữ liệu sản phẩm không đúng định dạng",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
        toast({
          title: "Cảnh báo",
          description: "Không thể tải danh sách sản phẩm",
          variant: "destructive",
        });
      }
      await fetchStats();
      console.log("Master data fetch completed");
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  // Fetch status
  const fetchStats = async () => {
    try {
      const statsData = await orderManagementService.getStats();
      setStats(statsData);
      console.log("Stats loaded:", statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  /**
   * Initial load
   */
  useEffect(() => {
    console.log("Component mounted, fetching master data...");
    fetchMasterData();
  }, []);

  /**
   * Reload orders khi filter thay đổi
   */
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  /**
   * Filtered orders theo search term
   */
  const filteredOrders = useMemo(() => {
    if (!searchTerm) return orders;

    const lowerSearch = searchTerm.toLowerCase();
    return orders.filter(
      (order) =>
        order.orderNumber.toLowerCase().includes(lowerSearch) ||
        order.customerName.toLowerCase().includes(lowerSearch) ||
        order.toName.toLowerCase().includes(lowerSearch) ||
        order.toPhone.includes(lowerSearch)
    );
  }, [orders, searchTerm]);

  /**
   * Tạo đơn hàng mới
   */
  const handleCreateOrder = async (data: CreateOutboundOrderRequest) => {
    try {
      setIsSubmitting(true);

      await orderManagementService.createOrder(data);

      toast({
        title: "Thành công",
        description: "Đã tạo đơn hàng mới",
      });

      await Promise.all([
        fetchOrders(),
        fetchStats(), // ← Refresh stats
      ]);
      return true;
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Lỗi",
        description: error?.response?.data?.message || "Không thể tạo đơn hàng",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Import đơn từ Excel
   */
  const handleImportExcel = async (
    file: File,
    customerId: number,
    toName: string,
    toPhone: string,
    toAddress: string
  ) => {
    try {
      setIsSubmitting(true);

      await orderManagementService.importOrderFromExcel(
        file,
        customerId,
        toName,
        toPhone,
        toAddress
      );

      toast({
        title: "Thành công",
        description: "Đã import đơn hàng từ Excel",
      });

      await Promise.all([
        fetchOrders(),
        fetchStats(), // ← Refresh stats
      ]);
      return true;
    } catch (error: any) {
      console.error("Error importing Excel:", error);
        toastError(error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Duyệt đơn hàng
   */
  const handleConfirmOrder = async (orderId: number) => {
    if (!confirm("Xác nhận duyệt đơn hàng này?")) return;

    try {
      setIsSubmitting(true);

      await orderManagementService.confirmOrder(orderId);

      toast({
        title: "Thành công",
        description: "Đã duyệt đơn hàng",
      });

      await Promise.all([
        fetchOrders(),
        fetchStats(), // ← Refresh stats
      ]);
    } catch (error: any) {
      console.error("Error confirming order:", error);
        toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Hủy đơn hàng
   */
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Xác nhận hủy đơn hàng này?")) return;

    try {
      setIsSubmitting(true);

      await orderManagementService.cancelOrder(orderId);

      toast({
        title: "Thành công",
        description: "Đã hủy đơn hàng",
      });

      await Promise.all([
        fetchOrders(),
        fetchStats(), // ← Refresh stats
      ]);
    } catch (error: any) {
      console.error("Error cancelling order:", error);
        toastError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset filters
   */
  const resetFilters = () => {
    setFilterStatus(undefined);
    setFilterCustomerId(undefined);
    setFilterFromDate("");
    setFilterToDate("");
    setSearchTerm("");
    setCurrentPage(0);
  };

  useEffect(() => {
    console.log("State updated:", {
      customers: customers.length,
      products: products.length,
      orders: orders.length,
      isCustomersArray: Array.isArray(customers),
      isProductsArray: Array.isArray(products),
    });
  }, [customers, products, orders]);

  return {
    // Data
    orders: filteredOrders,
    customers,
    products,
    stats,

    // Loading states
    isLoading,
    isSubmitting,

    // Filter states
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

    // Pagination
    currentPage,
    setCurrentPage,
    totalPages,
    totalElements,
    pageSize,

    // Actions
    handleCreateOrder,
    handleImportExcel,
    handleConfirmOrder,
    handleCancelOrder,
    resetFilters,
    fetchOrders,
    fetchStats,
  };
}
