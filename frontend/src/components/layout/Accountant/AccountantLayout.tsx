import { Outlet } from "react-router-dom";
import { AccountantSidebar } from "./AccountantSidebar.tsx";
import { AppHeader } from "@/components/layout/AppHeader.tsx";

export function AccountantLayout() {
  return (
    <div className="flex h-screen w-full bg-background">
      <AccountantSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <AppHeader />
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
