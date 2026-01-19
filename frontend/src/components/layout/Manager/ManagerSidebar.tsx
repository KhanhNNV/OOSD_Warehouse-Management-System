import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Warehouse,
  ClipboardCheck,
  FileBarChart,
  Receipt,
  Clipboard,
} from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const managerNav: NavItem[] = [
  { name: "Tổng quan", href: "/manager", icon: LayoutDashboard },
  { name: "Đơn nhập hàng", href: "/manager/purchase-order", icon: Clipboard },
  { name: "Phiếu nhập kho", href: "/manager/inbound", icon: PackagePlus },
    { name: "Đơn xuất hàng", href: "/manager/orders", icon: Receipt },
  { name: "Xuất kho", href: "/manager/outbound", icon: PackageMinus },
  { name: "Tồn kho", href: "/manager/inventory", icon: Warehouse },
  { name: "Kiểm kê", href: "/manager/stocktake", icon: ClipboardCheck },
  { name: "Báo cáo", href: "/manager/reports", icon: FileBarChart },
];

interface ManagerSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function ManagerSidebar({
  mobileOpen,
  onMobileClose,
}: ManagerSidebarProps) {
  return (
    <BaseSidebar
      logo={{ icon: Warehouse, text: "WMS Admin" }}
      navItems={managerNav}
      navLabel="Quản lý kho"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
