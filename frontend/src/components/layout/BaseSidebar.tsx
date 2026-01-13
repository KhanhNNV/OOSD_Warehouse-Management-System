import { Link, useLocation } from "react-router-dom";
import { X, ChevronLeft, Menu, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
}

interface BaseSidebarProps {
  logo: {
    icon: LucideIcon;
    text: string;
  };
  navItems: NavItem[];
  navLabel?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function BaseSidebar({
  logo,
  navItems,
  navLabel,
  mobileOpen = false,
  onMobileClose,
}: BaseSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (isMobile && mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, mobileOpen]);

  const renderNavGroup = (items: NavItem[], label?: string) => (
    <>
      {label && !desktopCollapsed && (
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
            onClick={() => {
              if (isMobile && onMobileClose) {
                onMobileClose();
              }
            }}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!desktopCollapsed && <span>{item.name}</span>}
          </Link>
        );
      })}
    </>
  );

  // MOBILE VERSION
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={onMobileClose}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "fixed top-0 left-0 bottom-0 z-50 w-64 bg-sidebar border-r border-sidebar-border",
            "transform transition-transform duration-300 ease-in-out md:hidden",
            "flex flex-col",
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <logo.icon className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="font-semibold text-sidebar-foreground text-lg">
                {logo.text}
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={onMobileClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {renderNavGroup(navItems, navLabel)}
          </nav>
        </aside>
      </>
    );
  }

  // DESKTOP VERSION
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
        desktopCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <logo.icon className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          {!desktopCollapsed && (
            <span className="font-semibold text-sidebar-foreground text-lg">
              {logo.text}
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {renderNavGroup(navItems, navLabel)}
      </nav>

      {/* Collapse Button */}
      <div className="px-3 py-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDesktopCollapsed(!desktopCollapsed)}
          className="w-full justify-start gap-3 px-3 py-2.5 text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {desktopCollapsed ? (
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
