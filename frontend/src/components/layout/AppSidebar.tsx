import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Warehouse,
  ClipboardCheck,
  FileBarChart,
  Settings,
  ChevronLeft,
  Menu,
  Users,
  MapPin,
  Database,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";

const managerNav = [
  { name: "Tổng quan", href: "/", icon: LayoutDashboard },
  { name: "Nhập kho", href: "/inbound", icon: PackagePlus },
  { name: "Xuất kho", href: "/outbound", icon: PackageMinus },
  { name: "Tồn kho", href: "/inventory", icon: Warehouse },
  { name: "Kiểm kê", href: "/stocktake", icon: ClipboardCheck },
  { name: "Báo cáo", href: "/reports", icon: FileBarChart },
];

const adminNav = [
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Cấu trúc kho", href: "/admin/warehouse", icon: MapPin },
  { name: "Danh mục", href: "/admin/master-data", icon: Database },
];

const accountantNav = [
  { name: "Tài chính", href: "/accountant/finance", icon: Receipt },
];

const bottomNavigation = [
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const renderNavGroup = (items: typeof managerNav, label?: string) => (
    <>
      {label && !collapsed && (
        <p className="px-3 py-2 text-xs font-semibold text-sidebar-muted uppercase tracking-wider">
          {label}
        </p>
      )}
      {items.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </>
  );

  return (
    <aside
      className={cn(
        "flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Warehouse className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!collapsed && (
            <span className="font-semibold text-sidebar-foreground text-lg">
              WMS Admin
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {renderNavGroup(managerNav, "Quản lý kho")}
        
        {!collapsed && <Separator className="my-4 bg-sidebar-border" />}
        {collapsed && <div className="my-2" />}
        
        {renderNavGroup(adminNav, "Quản trị")}
        
        {!collapsed && <Separator className="my-4 bg-sidebar-border" />}
        {collapsed && <div className="my-2" />}
        
        {renderNavGroup(accountantNav, "Kế toán")}
      </nav>

      {/* Bottom Navigation */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        {bottomNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          );
        })}

        {/* Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-start gap-3 px-3 py-2.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? (
            <Menu className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span>Thu gọn</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  );
}
