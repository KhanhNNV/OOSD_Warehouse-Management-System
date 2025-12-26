import { useState, useEffect } from "react";
import { PurchaseOrder } from "@/types/inbound";
import { inboundService } from "@/services/inbound.service";
import { toast } from "@/hooks/use-toast";

export function useInbound() {
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        inboundService.getPOs().then((data) => {
            setOrders(data);
            setIsLoading(false);
        });
    }, []);

    const handleFileUpload = (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/)) {
            toast({ title: "Lỗi", description: "Chỉ chấp nhận file Excel", variant: "destructive" });
            return;
        }
        // Simulate logic tạo đơn từ Excel
        const newPO: PurchaseOrder = {
            id: Math.random().toString(),
            poNumber: `PO-EXCEL-${Date.now().toString().slice(-4)}`,
            supplierName: "NCC từ Excel",
            status: "NEW",
            createdAt: new Date().toISOString(),
            expectedDate: new Date().toISOString(),
            totalItems: 50,
            receivedItems: 0,
            hasVariance: false
        };
        setOrders([newPO, ...orders]);
        toast({ title: "Thành công", description: "Đã nhập đơn hàng từ file" });
    };

    const filteredOrders = orders.filter(po =>
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return { orders: filteredOrders, searchTerm, setSearchTerm, isLoading, handleFileUpload };
}