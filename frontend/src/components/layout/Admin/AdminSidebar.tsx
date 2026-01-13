import {
  LayoutDashboard,
  Warehouse,
  Users,
  Database,
  Settings,
} from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const adminNav: NavItem[] = [
  { name: "Tổng quan", href: "/admin", icon: LayoutDashboard },
  { name: "Người dùng", href: "/admin/users", icon: Users },
  { name: "Kho Hàng", href: "/admin/warehouse", icon: Warehouse },
  { name: "Danh mục", href: "/admin/master-data", icon: Database },
  { name: "Cài đặt", href: "/admin/settings", icon: Settings },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  return (
    <BaseSidebar
      logo={{ icon: Warehouse, text: "WMS Admin" }}
      navItems={adminNav}
      navLabel="Quản trị viên"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
