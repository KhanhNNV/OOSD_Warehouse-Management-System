import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { ReactNode, useState } from "react";

interface BaseLayoutProps {
  sidebar: (props: {
    mobileOpen: boolean;
    onMobileClose: () => void;
  }) => ReactNode;
}

export function BaseLayout({ sidebar }: BaseLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      {sidebar({
        mobileOpen: mobileMenuOpen,
        onMobileClose: () => setMobileMenuOpen(false),
      })}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <AppHeader onMenuClick={() => setMobileMenuOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
