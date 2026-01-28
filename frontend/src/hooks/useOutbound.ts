// import { useState, useEffect, useMemo } from "react";
// import { SalesOrder, OutboundStats } from "@/types/outbound";
// import { outboundService } from "@/services/outbound.service";

// export function useOutbound() {
//     const [orders, setOrders] = useState<SalesOrder[]>([]);
//     const [searchTerm, setSearchTerm] = useState("");

//     useEffect(() => {
//         outboundService.getSOs().then(setOrders);
//     }, []);

//     const stats: OutboundStats = useMemo(() => ({
//         new: orders.filter(o => o.status === 'NEW').length,
//         // Gom nhóm trạng thái xử lý kho
//         processing: orders.filter(o => ['ALLOCATED', 'PICKING', 'PACKED'].includes(o.status)).length,
//         shipped: orders.filter(o => o.status === 'SHIPPED').length
//     }), [orders]);

//     const filteredOrders = orders.filter(so =>
//         so.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
//         so.customerName.toLowerCase().includes(searchTerm.toLowerCase())
//     );

//     return { orders: filteredOrders, stats, searchTerm, setSearchTerm };
// }

import { useState, useEffect } from "react";
import { outboundService } from "@/services/outbound.service";
import { OutboundOrder } from "@/types/outbound";
import { useToast } from "./use-toast";

export function useOutbound() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<OutboundOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch orders
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await outboundService.getPendingOrders();
      setOrders(data);
    } catch (error: any) {
      toast({
        title: "Lỗi kết nối",
        description: error.response?.data?.details || "Không thể tải danh sách đơn hàng",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter(order => 
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.toName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const stats = {
    new: orders.filter(o => o.status === "NEW").length,
    processing: orders.filter(o => ["ALLOCATED", "PICKING", "PACKED"].includes(o.status)).length,
    shipped: orders.filter(o => o.status === "SHIPPED").length
  };

  return {
    orders: filteredOrders,
    isLoading,
    searchTerm,
    setSearchTerm,
    stats,
    refetch: fetchOrders
  };
}