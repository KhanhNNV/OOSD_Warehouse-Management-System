import {
  LayoutDashboard,
  Warehouse,
  FileText,
  Receipt,
  PackagePlus,
} from "lucide-react";
import { BaseSidebar, NavItem } from "../BaseSidebar";

const accountantNav = [
  { name: "Tổng quan", href: "/accountant", icon: LayoutDashboard },
  // Thêm dòng này vào để trỏ tới trang InvoicePage
  // 👇 MỚI: Quản lý hóa đơn nhập (Trả tiền NCC)
  {
    name: "Hóa đơn nhập (NCC)",
    href: "/accountant/supplier-invoices",
    icon: PackagePlus,
  },
  { name: "Xuất Hóa Đơn", href: "/accountant/invoices", icon: FileText },
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
      logo={{ icon: Warehouse, text: "WMS System" }}
      navItems={accountantNav}
      navLabel="Kế toán"
      mobileOpen={mobileOpen}
      onMobileClose={onMobileClose}
    />
  );
}
