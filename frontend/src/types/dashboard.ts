import { LucideIcon } from "lucide-react";

export interface DashboardStats {
  totalProducts: number;
  pendingPutAway: number;
  availableShelves: number;
  totalCategories: number;
  lowStockCount: number;
  todayInbound: number;
  todayOutbound: number;
}

export interface RecentActivity {
  id: string;
  type: "inbound" | "outbound" | "transit";
  description: string;
  timestamp: string;
  user?: string;
}

export interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "info" | "danger";
  trend?: {
    value: number;
    isPositive: boolean;
  } | null;
  subtitle?: string;
  onClick?: () => void;
}

export interface ProductRowProps {
  product: {
    sku: string;
    name: string;
    quantity: number;
    imageUrl?: string;
    trend?: "UP" | "DOWN" | "STABLE";
  };
  rank: number;
}

export interface SummaryItemProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: string;
  bgColor?: string;
  subtitle?: string;
}

export interface QuickButtonProps {
  label: string;
  description?: string;
  icon?: React.ElementType;
  badge?: number | string;
  variant?: "default" | "primary" | "outline";
  onClick?: () => void;
}

export interface ActivityRowProps {
  activity: {
    id: string | number;
    type: "inbound" | "outbound" | "transit" | "stocktake" | "adjustment";
    description: string;
    username?: string;
    timestamp: string;
  };
}

export interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
