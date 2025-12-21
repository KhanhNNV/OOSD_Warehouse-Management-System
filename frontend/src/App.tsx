import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import InboundPage from "./pages/Inbound";
import OutboundPage from "./pages/Outbound";
import InventoryPage from "./pages/Inventory";
import StocktakePage from "./pages/Stocktake";
import StocktakeDetailPage from "./pages/StocktakeDetail";
import ReportsPage from "./pages/Reports";
import SettingsPage from "./pages/Settings";
import UserManagementPage from "./pages/admin/UserManagement";
import WarehouseLayoutPage from "./pages/admin/WarehouseLayout";
import MasterDataPage from "./pages/admin/MasterData";
import FinancePage from "./pages/accountant/Finance";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inbound" element={<InboundPage />} />
            <Route path="/outbound" element={<OutboundPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/stocktake" element={<StocktakePage />} />
            <Route path="/stocktake/:id" element={<StocktakeDetailPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Admin Routes */}
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/warehouse" element={<WarehouseLayoutPage />} />
            <Route path="/admin/master-data" element={<MasterDataPage />} />
            {/* Accountant Routes */}
            <Route path="/accountant/finance" element={<FinancePage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
