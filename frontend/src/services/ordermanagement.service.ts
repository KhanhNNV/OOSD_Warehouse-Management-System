
import api from "@/services/api";
import {
  OutboundOrder,
  CreateOutboundOrderRequest,
  OutboundOrderFilterParams,
  ApiResponse,
  PageResponse,
  Customer,
  Product,
  OutboundStats,
} from "@/types/outboundordermanagement";

export const orderManagementService = {
  /**
   * Lấy danh sách đơn hàng với filter
   */
  getOrders: async (params: OutboundOrderFilterParams = {}) => {
    try {
      const queryParams = new URLSearchParams();

      if (params.status) queryParams.append("status", params.status);
      if (params.customerId)
        queryParams.append("customerId", params.customerId.toString());
      if (params.fromDate) queryParams.append("fromDate", params.fromDate);
      if (params.toDate) queryParams.append("toDate", params.toDate);
      if (params.page !== undefined)
        queryParams.append("page", params.page.toString());
      if (params.size !== undefined)
        queryParams.append("size", params.size.toString());

      const res = await api.get(
        `/api/outbound-orders/manager?${queryParams.toString()}`
      );

      console.log("✅ getOrders response:", res.data);

      // Handle different response structures
      if (res.data.success && res.data.data) {
        // ApiResponse wrapper
        if (res.data.data.content) {
          // Page object inside ApiResponse
          return res.data.data;
        }
        return {
          content: Array.isArray(res.data.data) ? res.data.data : [],
          pageable: { pageNumber: 0, pageSize: 20 },
          totalPages: 1,
          totalElements: Array.isArray(res.data.data)
            ? res.data.data.length
            : 0,
          last: true,
          first: true,
        };
      } else if (res.data.content) {
        // Direct Page object
        return res.data;
      }

      // Fallback: empty page
      return {
        content: [],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalPages: 0,
        totalElements: 0,
        last: true,
        first: true,
      };
    } catch (error: any) {
      console.error("❌ Error in getOrders:", error);
      throw error;
    }
  },

  /**
   * Lấy danh sách khách hàng (active)
   */
  getCustomers: async (): Promise<Customer[]> => {
    try {
      const res = await api.get("/api/customers", {
        params: {
          isActive: true,
          page: 0,
          size: 1000, // Get all active customers
        },
      });

      console.log("✅ getCustomers raw response:", res.data);

      // ✅ FIX: Handle different response structures
      if (res.data.success && res.data.data) {
        // ApiResponse wrapper
        if (res.data.data.content && Array.isArray(res.data.data.content)) {
          // Page object: { content: [...], totalElements: ... }
          console.log(
            "✅ Customers from Page.content:",
            res.data.data.content.length
          );
          return res.data.data.content;
        } else if (Array.isArray(res.data.data)) {
          // Direct array
          console.log("✅ Customers from data array:", res.data.data.length);
          return res.data.data;
        }
      } else if (res.data.content && Array.isArray(res.data.content)) {
        // Direct Page object without wrapper
        console.log("✅ Customers from direct Page:", res.data.content.length);
        return res.data.content;
      } else if (Array.isArray(res.data)) {
        // Direct array without wrapper
        console.log("✅ Customers from direct array:", res.data.length);
        return res.data;
      }

      console.warn("⚠️ Unexpected customers response structure:", res.data);
      return [];
    } catch (error: any) {
      console.error("❌ Error in getCustomers:", error);
      console.error("Response:", error.response?.data);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Lấy danh sách sản phẩm
   */
  getProducts: async (): Promise<Product[]> => {
    try {
      const res = await api.get("/api/products");

      console.log("✅ getProducts raw response:", res.data);

      // Handle different response structures
      if (res.data.success && res.data.data) {
        if (Array.isArray(res.data.data)) {
          return res.data.data;
        } else if (res.data.data.content) {
          return res.data.data.content;
        }
      } else if (Array.isArray(res.data)) {
        return res.data;
      } else if (res.data.content) {
        return res.data.content;
      }

      console.warn("⚠️ Unexpected products response structure:", res.data);
      return [];
    } catch (error: any) {
      console.error("❌ Error in getProducts:", error);
      console.error("Response:", error.response?.data);
      return []; // Return empty array instead of throwing
    }
  },

  /**
   * Lấy chi tiết đơn hàng
   */
  getOrderById: async (orderId: number) => {
    try {
      const res = await api.get(`/api/outbound-orders/${orderId}`);

      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return res.data;
    } catch (error: any) {
      console.error("❌ Error in getOrderById:", error);
      throw error;
    }
  },

  /**
   * Tạo đơn hàng mới
   */
  createOrder: async (data: CreateOutboundOrderRequest) => {
    try {
      const res = await api.post("/api/outbound-orders", data);

      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return res.data;
    } catch (error: any) {
      console.error("❌ Error in createOrder:", error);
      throw error;
    }
  },

  /**
   * Import đơn hàng từ Excel
   */
  importOrderFromExcel: async (
    file: File,
    customerId: number,
    toName: string,
    toPhone: string,
    toAddress: string
  ) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("customerId", customerId.toString());
      formData.append("toName", toName);
      formData.append("toPhone", toPhone);
      formData.append("toAddress", toAddress);

      const res = await api.post("/api/outbound-orders/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return res.data;
    } catch (error: any) {
      console.error("❌ Error in importOrderFromExcel:", error);
      throw error;
    }
  },

  /**
   * Duyệt đơn hàng
   */
  confirmOrder: async (orderId: number) => {
    try {
      const res = await api.put(`/api/outbound-orders/${orderId}/confirm`);

      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return res.data;
    } catch (error: any) {
      console.error("❌ Error in confirmOrder:", error);
      throw error;
    }
  },

  /**
   * Hủy đơn hàng
   */
  cancelOrder: async (orderId: number) => {
    try {
      const res = await api.put(`/api/outbound-orders/${orderId}/cancel`);

      if (res.data.success && res.data.data) {
        return res.data.data;
      }
      return res.data;
    } catch (error: any) {
      console.error("❌ Error in cancelOrder:", error);
      throw error;
    }
  },

  /**
   * Lấy thống kê tổng quan
   */
  getStats: async (): Promise<OutboundStats> => {
    try {
      console.log("🔄 Fetching stats using filter API...");

      const [newRes, allocatedRes, pickingRes, completedRes, cancelledRes] =
        await Promise.all([
          api.get("/api/outbound-orders/manager?status=NEW&page=0&size=0"),
          api.get(
            "/api/outbound-orders/manager?status=ALLOCATED&page=0&size=0"
          ),
          api.get("/api/outbound-orders/manager?status=PICKING&page=0&size=0"),
          api.get(
            "/api/outbound-orders/manager?status=COMPLETED&page=0&size=0"
          ),
          api.get(
            "/api/outbound-orders/manager?status=CANCELLED&page=0&size=0"
          ),
        ]);
      // Extract totalElements from each response
      const extractCount = (response: any): number => {
        if (
          response.data?.success &&
          response.data?.data?.totalElements !== undefined
        ) {
          return response.data.data.totalElements;
        }
        if (response.data?.totalElements !== undefined) {
          return response.data.totalElements;
        }
        return 0;
      };

      const stats = {
        new: extractCount(newRes),
        allocated: extractCount(allocatedRes),
        picking: extractCount(pickingRes),
        completed: extractCount(completedRes),
        cancelled: extractCount(cancelledRes),
      };

      console.log("✅ Stats fetched:", stats);
      return stats;
    } catch (error) {
      console.error("❌ Error in getStats:", error);
      return {
        new: 0,
        allocated: 0,
        picking: 0,
        completed: 0,
        cancelled: 0,
      };
    }
  },

  // Utility functions
  formatCurrency: (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  },

  formatDate: (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },
};
