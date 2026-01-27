import {
  LayoutDashboard,
  PackagePlus,
  PackageMinus,
  Warehouse,
  ClipboardCheck,
  PackageCheck,
  Clipboard,
  Package,
    ArrowLeftRight
} from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const staffNav: NavItem[] = [
  { name: "Tổng quan", href: "/staff", icon: LayoutDashboard },
  { name: "Đơn mua hàng", href: "/staff/purchase-order", icon: Clipboard },
  { name: "Phiếu nhập kho", href: "/staff/inboundNote", icon: PackageCheck },
  { name: "Nhập kho", href: "/staff/picking", icon: Package },
  { name: "Xuất kho", href: "/staff/outbound", icon: PackageMinus },
  { name: "Tồn kho", href: "/staff/inventory", icon: Warehouse },
  { name: "Kiểm kê", href: "/staff/stocktake", icon: ClipboardCheck },
  { name: "Chuyển vị trí", href: "/staff/relocate", icon: ArrowLeftRight },
];

interface StaffSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function StaffSidebar({ mobileOpen, onMobileClose }: StaffSidebarProps) {
  return (
    <BaseSidebar
      logo={{ icon: Warehouse, text: "WMS Admin" }}
      navItems={staffNav}
      navLabel="Nhân viên kho"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
