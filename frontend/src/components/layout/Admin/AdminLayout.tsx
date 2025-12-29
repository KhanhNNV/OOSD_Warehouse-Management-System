import { Outlet } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AppHeader } from "@/components/layout/AppHeader.tsx";

export function AdminLayout() {
    return (
        <div className="flex h-screen w-full bg-background">
            <AdminSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <AppHeader />
                <main className="flex-1 overflow-auto p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
