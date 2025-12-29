import { POStatus } from "@/types/inbound";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, Truck, Archive, XCircle } from "lucide-react";

const config: Record<POStatus, { label: string; className: string; icon: any }> = {
    NEW: { label: "Mới tạo", className: "bg-gray-100 text-gray-700 border-gray-200", icon: FileText },
    APPROVED: { label: "Đã duyệt", className: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
    RECEIVING: { label: "Đang nhận hàng", className: "bg-orange-50 text-orange-700 border-orange-200 animate-pulse", icon: Truck },
    COMPLETED: { label: "Hoàn tất", className: "bg-green-50 text-green-700 border-green-200", icon: Archive },
    CANCELLED: { label: "Đã hủy", className: "bg-red-50 text-red-700 border-red-200", icon: XCircle },
};

export function POStatusBadge({ status }: { status: POStatus }) {
    const { label, className, icon: Icon } = config[status];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border", className)}>
      <Icon className="w-3.5 h-3.5" />
            {label}
    </span>
    );
}