import { LayoutDashboard, Warehouse, FileText, Receipt } from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const accountantNav: NavItem[] = [
  { name: "Tổng quan", href: "/accountant", icon: LayoutDashboard },
  { name: "Xuất Hóa Đơn", href: "/accountant/invoices", icon: FileText },
  { name: "Tài chính", href: "/accountant/finance", icon: Receipt },
];

interface AccountantSidebarProps {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function AccountantSidebar({
  mobileOpen,
  onMobileClose,
}: AccountantSidebarProps) {
  return (
    <BaseSidebar
      logo={{ icon: Warehouse, text: "WMS Admin" }}
      navItems={accountantNav}
      navLabel="Kế toán"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
