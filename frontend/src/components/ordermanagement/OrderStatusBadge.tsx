import { Badge } from "@/components/ui/badge";
import { OrderStatus } from "@/types/outboundordermanagement";

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config: Record<
    OrderStatus,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    NEW: { label: "Mới", variant: "default" },
    ALLOCATED: { label: "Đã phân bổ", variant: "secondary" },
    PICKING: { label: "Đang lấy hàng", variant: "outline" },
    PACKED: { label: "Đã đóng gói", variant: "outline" },
    SHIPPED: { label: "Đã giao vận", variant: "secondary" },
    COMPLETED: { label: "Hoàn thành", variant: "default" },
    CANCELLED: { label: "Đã hủy", variant: "destructive" },
  };

  const { label, variant } = config[status];

  return <Badge variant={variant}>{label}</Badge>;
}
