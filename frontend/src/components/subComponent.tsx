import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Minus,
  Package,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MetricCardProps,
  ProductRowProps,
  QuickButtonProps,
  SummaryItemProps,
} from "@/types/dashboard";
import { formatDistanceToNow } from "node_modules/date-fns/formatDistanceToNow";

// Sub-components
export function TaskCard({
  title,
  value,
  icon: Icon,
  variant,
  action,
  onClick,
}: any) {
  const variants = {
    success: "border-green-200 bg-green-50",
    warning: "border-amber-200 bg-amber-50",
    info: "border-blue-200 bg-blue-50",
  };

  return (
    <Card className={variants[variant]}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Icon className="w-8 h-8 opacity-70" />
          <span className="text-3xl font-bold">{value}</span>
        </div>
        <p className="text-sm font-medium mb-2">{title}</p>
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={onClick}
        >
          {action} <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );
}

export function QuickLink({ label, icon: Icon, badge, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {badge !== undefined && <Badge variant="outline">{badge}</Badge>}
    </button>
  );
}

export function TransitItem({ item }: any) {
  return (
    <div className="flex items-center gap-3 pb-3 border-b last:border-0">
      {item.imageUrl && (
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="w-10 h-10 rounded object-cover"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.productName}</p>
        <p className="text-xs text-muted-foreground">{item.sku}</p>
      </div>
      <Badge>{item.quantity}</Badge>
    </div>
  );
}

export function ActivityRow({ activity }: any) {
  const typeColors = {
    inbound: "bg-blue-100 text-blue-700",
    outbound: "bg-purple-100 text-purple-700",
    transit: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="flex items-start gap-3 pb-3 border-b last:border-0">
      <Badge
        variant="outline"
        className={`${typeColors[activity.type]} text-xs`}
      >
        {activity.type === "inbound"
          ? "Nhập"
          : activity.type === "outbound"
            ? "Xuất"
            : "Chờ"}
      </Badge>
      <div className="flex-1 min-w-0">
        <p className="text-sm truncate">{activity.description}</p>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(activity.timestamp).toLocaleString("vi-VN")}
        </p>
      </div>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
      <Package className="w-12 h-12 mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export function DashboardSkeleton() {
  return <div>Loading...</div>;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  variant = "default",
  trend,
  subtitle,
  onClick,
}: MetricCardProps) {
  // Variant styles
  const variantStyles = {
    default: {
      card: "border-slate-200 bg-white",
      icon: "bg-slate-50 text-slate-700",
      text: "text-slate-900",
    },
    success: {
      card: "border-green-200 bg-green-50",
      icon: "bg-green-100 text-green-700",
      text: "text-green-900",
    },
    warning: {
      card: "border-amber-200 bg-amber-50",
      icon: "bg-amber-100 text-amber-700",
      text: "text-amber-900",
    },
    info: {
      card: "border-blue-200 bg-blue-50",
      icon: "bg-blue-100 text-blue-700",
      text: "text-blue-900",
    },
    danger: {
      card: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-700",
      text: "text-red-900",
    },
  };

  const styles = variantStyles[variant];

  return (
    <Card
      className={cn(
        styles.card,
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:-translate-y-1",
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          {/* Left side - Text content */}
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn("text-3xl font-bold tracking-tight", styles.text)}>
              {typeof value === "number"
                ? value.toLocaleString("vi-VN")
                : value}
            </p>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}

            {/* Trend indicator */}
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 text-xs font-medium mt-2",
                  trend.isPositive ? "text-green-600" : "text-red-600",
                )}
              >
                {trend.isPositive ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                <span>
                  {trend.isPositive ? "+" : ""}
                  {trend.value}%
                </span>
                <span className="text-muted-foreground ml-1">vs trước</span>
              </div>
            )}
          </div>

          {/* Right side - Icon */}
          <div className={cn("p-3 rounded-full shrink-0", styles.icon)}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductRow({ product, rank }: ProductRowProps) {
  const { sku, name, quantity, imageUrl, trend = "STABLE" } = product;

  // Trend icons and colors
  const trendConfig = {
    UP: {
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    DOWN: {
      icon: TrendingDown,
      color: "text-red-600",
      bg: "bg-red-50",
    },
    STABLE: {
      icon: Minus,
      color: "text-slate-400",
      bg: "bg-slate-50",
    },
  };

  const TrendIcon = trendConfig[trend].icon;

  return (
    <div className="flex items-center gap-3 py-3 border-b last:border-0 hover:bg-accent/50 transition-colors rounded px-2">
      {/* Rank badge */}
      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold shrink-0">
        {rank}
      </div>

      {/* Product image */}
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={name}
          className="w-12 h-12 rounded-lg object-cover shrink-0 border"
          onError={(e) => {
            e.currentTarget.src = "/placeholder-product.png"; // Fallback image
          }}
        />
      ) : (
        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
          <span className="text-xs text-slate-400 font-medium">
            {name.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )}

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" title={name}>
          {name}
        </p>
        <p className="text-xs text-muted-foreground font-mono">{sku}</p>
      </div>

      {/* Quantity and trend */}
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className="font-semibold">
          {quantity.toLocaleString("vi-VN")}
        </Badge>
        <div className={cn("p-1 rounded", trendConfig[trend].bg)}>
          <TrendIcon className={cn("w-4 h-4", trendConfig[trend].color)} />
        </div>
      </div>
    </div>
  );
}

export function SummaryItem({
  label,
  value,
  icon: Icon,
  color = "text-blue-600",
  bgColor = "bg-blue-50",
  subtitle,
}: SummaryItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow">
      {/* Icon container */}
      <div className={cn("p-3 rounded-lg shrink-0", bgColor)}>
        <Icon className={cn("w-6 h-6", color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className={cn("text-2xl font-bold tracking-tight mt-0.5", color)}>
          {typeof value === "number" ? value.toLocaleString("vi-VN") : value}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function QuickButton({
  label,
  description,
  icon: Icon,
  badge,
  variant = "outline",
  onClick,
}: QuickButtonProps) {
  // Variant styles
  const variantStyles = {
    default: "border hover:bg-accent",
    primary: "border-primary/20 bg-primary/5 hover:bg-primary/10",
    outline: "border hover:bg-accent",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-lg transition-all duration-200 text-left group",
        variantStyles[variant],
        "hover:shadow-md hover:scale-[1.02]",
      )}
    >
      {/* Icon (if provided) */}
      {Icon && (
        <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors shrink-0">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {badge !== undefined && (
            <Badge variant="secondary" className="ml-auto">
              {badge}
            </Badge>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
            {description}
          </p>
        )}
      </div>

      {/* Arrow icon */}
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
    </button>
  );
}
