import { useState, useEffect, useMemo } from "react";
import { SalesOrder, OutboundStats } from "@/types/outbound";
import { outboundService } from "@/services/outbound.service";

export function useOutbound() {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        outboundService.getSOs().then(setOrders);
    }, []);

    const stats: OutboundStats = useMemo(() => ({
        new: orders.filter(o => o.status === 'NEW').length,
        // Gom nhóm trạng thái xử lý kho
        processing: orders.filter(o => ['ALLOCATED', 'PICKING', 'PACKED'].includes(o.status)).length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length
    }), [orders]);

    const filteredOrders = orders.filter(so =>
        so.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        so.customerName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { orders: filteredOrders, stats, searchTerm, setSearchTerm };
}