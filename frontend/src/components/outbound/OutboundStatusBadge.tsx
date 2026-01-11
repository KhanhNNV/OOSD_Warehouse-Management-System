import { SOStatus, getStatusColor, getStatusLabel } from "@/types/outbound";
import { cn } from "@/lib/utils";

interface OutboundStatusBadgeProps {
  status: SOStatus;
  className?: string;
}

export function OutboundStatusBadge({ status, className }: OutboundStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        getStatusColor(status),
        className
      )}
    >
      {getStatusLabel(status)}
    </span>
  );
}