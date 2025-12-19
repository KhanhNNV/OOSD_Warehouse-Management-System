import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success" | "info";
  className?: string;
}

const variantStyles = {
  default: "bg-card",
  warning: "bg-warning/5 border-warning/20",
  success: "bg-success/5 border-success/20",
  info: "bg-info/5 border-info/20",
};

const iconVariantStyles = {
  default: "bg-primary/10 text-primary",
  warning: "bg-warning/10 text-warning",
  success: "bg-success/10 text-success",
  info: "bg-info/10 text-info",
};

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border p-6 transition-all hover:shadow-md",
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold mt-2">{value}</p>
          {trend && (
            <p
              className={cn(
                "text-sm mt-2",
                trend.isPositive ? "text-success" : "text-destructive"
              )}
            >
              {trend.isPositive ? "+" : "-"}
              {Math.abs(trend.value)}% so với tuần trước
            </p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", iconVariantStyles[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
