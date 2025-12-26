import { SOStatus } from "@/types/outbound";
import { cn } from "@/lib/utils";
import { ShoppingCart, BoxSelect, User, PackageCheck, Truck } from "lucide-react";

const config: Record<SOStatus, { label: string; className: string; icon: any }> = {
    NEW: { label: "Đơn mới", className: "bg-slate-100 text-slate-700 border-slate-200", icon: ShoppingCart },
    // ALLOCATED: Màu tím - thể hiện trạng thái hệ thống (System Reserved)
    ALLOCATED: { label: "Đã giữ chỗ", className: "bg-purple-50 text-purple-700 border-purple-200", icon: BoxSelect },
    // PICKING: Màu vàng - hành động vật lý đang diễn ra
    PICKING: { label: "Đang lấy hàng", className: "bg-yellow-50 text-yellow-700 border-yellow-200", icon: User },
    PACKED: { label: "Đã đóng gói", className: "bg-indigo-50 text-indigo-700 border-indigo-200", icon: PackageCheck },
    SHIPPED: { label: "Đã giao đi", className: "bg-green-50 text-green-700 border-green-200", icon: Truck },
};

export function SOStatusBadge({ status }: { status: SOStatus }) {
    const { label, className, icon: Icon } = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", className)}>
      <Icon className="w-3.5 h-3.5" />
            {label}
    </span>
    );
}