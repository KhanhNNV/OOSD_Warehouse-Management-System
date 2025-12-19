import { cn } from "@/lib/utils";

export type StatusType = "pending" | "processing" | "completed" | "error" | "draft" | "open";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: {
    label: "Chờ xử lý",
    className: "bg-warning/10 text-warning border-warning/20",
  },
  processing: {
    label: "Đang xử lý",
    className: "bg-info/10 text-info border-info/20",
  },
  completed: {
    label: "Hoàn thành",
    className: "bg-success/10 text-success border-success/20",
  },
  error: {
    label: "Lỗi",
    className: "bg-destructive/10 text-destructive border-destructive/20",
  },
  draft: {
    label: "Nháp",
    className: "bg-muted text-muted-foreground border-border",
  },
  open: {
    label: "Đang mở",
    className: "bg-primary/10 text-primary border-primary/20",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
