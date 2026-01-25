import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Warehouse,
  ClipboardCheck,
  PackageCheck,
  Clipboard,
  ArrowDownToLine,
} from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const staffNav: NavItem[] = [
  { name: "Tổng quan", href: "/staff", icon: LayoutDashboard },
  { name: "Đơn mua hàng", href: "/staff/purchase-order", icon: Clipboard },
  { name: "Phiếu nhập kho", href: "/staff/inboundNote", icon: PackageCheck },
  { name: "Nhập kho", href: "/staff/picking", icon: PackagePlus },
  { name: "Cất hàng", href: "/staff/put-away", icon: ArrowDownToLine },
  { name: "Xuất kho", href: "/staff/outbound", icon: PackageMinus },
  { name: "Tồn kho", href: "/staff/inventory", icon: Warehouse },
  { name: "Kiểm kê", href: "/staff/stocktake", icon: ClipboardCheck },
];

interface StaffSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function StaffSidebar({ mobileOpen, onMobileClose }: StaffSidebarProps) {
  return (
    <BaseSidebar
      logo={{ icon: Warehouse, text: "WMS STAFF" }}
      navItems={staffNav}
      navLabel="Nhân viên kho"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
