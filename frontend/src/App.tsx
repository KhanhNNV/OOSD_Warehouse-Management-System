// src/App.tsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types/auth"; // Import Enum
import { authUtils } from "@/utils/auth";

// Layouts
import { AdminLayout } from "./components/layout/Admin/AdminLayout";
import { ManagerLayout } from "./components/layout/Manager/ManagerLayout";
import { StaffLayout } from "./components/layout/Staff/StaffLayout";
import { AccountantLayout } from "./components/layout/Accountant/AccountantLayout.tsx";

// Components & Pages
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/auth/LoginPage";
import PendingApproval from "./pages/PendingApproval";
import Unauthorized from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";
import InboundPage from "@/pages/staff/purchaseOrder.tsx";
import OutboundPage from "@/pages/staff/Outbound.tsx";
import Dashboard from "@/pages/admin/Dashboard.tsx";
import CreateUserPage from "@/pages/admin/UserManagement.tsx";
import Register from "@/pages/auth/RegisterPage.tsx";
import InboundScanning from "@/pages/staff/InboundScanning";
import POPageManager from "@/pages/manager/POPageManager.tsx";
import OutboundDetail from "@/pages/staff/OutboundDetail";
import InvoicePage from "@/pages/accountant/InvoicePage.tsx";
import OrderManagementPage from "./pages/manager/OrderManagementPage.tsx";
import { AuthInitializer } from "@/components/AuthInitializer";
// Dashboard Pages (Ví dụ)
import AdminDashboard from "./pages/admin/Dashboard";
import WarehouseTab from "./pages/admin/WarehouseTab";
import ManagerDashboard from "./pages/manager/Dashboard";
import StaffDashboard from "./pages/staff/Dashboard";
import AccountantDashboard from "./pages/accountant/Dashboard";
import { Settings } from "lucide-react";
import SettingsPage from "@/pages/admin/Settings.tsx";
import AuthPage from "@/pages/auth/AuthPage.tsx";
import UserManagement from "@/pages/admin/UserManagement.tsx";
import PickingPage from "@/pages/staff/PickingPage.tsx";
import PutAwayPage from "@/pages/staff/PutAwayPage.tsx";
import MasterDataPage from "./pages/admin/MasterDataPage.tsx";
import InboundNotesPage from "@/pages/staff/InboundNotes.tsx";
import PurchaseOrderPage from "@/pages/staff/purchaseOrder.tsx";
import InboundManagerPage from "@/pages/manager/InboundManagerPage.tsx";
import PickingInstructionPage from "@/pages/staff/PickingInstructionPage";

import OutboundPickingPage from "./pages/staff/OutboundPickingPage.tsx";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <BrowserRouter>
        <AuthInitializer>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<AuthPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />
              <Route path="/register" element={<Register />} />

              {/* Route dành riêng cho user chưa được duyệt (Role = NONE) */}
              <Route element={<ProtectedRoute />}>
                <Route path="/pending-approval" element={<PendingApproval />} />
              </Route>

              {/* 1. ADMIN ROUTES */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="warehouse" element={<WarehouseTab />} />
                <Route path="master-data" element={<MasterDataPage />} />
              </Route>

              {/* 2. MANAGER ROUTES */}
              <Route
                path="/manager"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>
                    <ManagerLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ManagerDashboard />} />
                <Route path="outbound" element={<OutboundPage />} />
                <Route path="purchase-order" element={<POPageManager />} />
                <Route path="inbound" element={<InboundManagerPage />} />
                <Route path="orders" element={<OrderManagementPage />} />
              </Route>

              {/* 3. STAFF ROUTES */}
              <Route
                path="/staff"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.STAFF]}>
                    <StaffLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<StaffDashboard />} />
                <Route path="purchase-order" element={<PurchaseOrderPage />} />
                <Route path="inboundNote" element={<InboundNotesPage />} />
                <Route path="outbound" element={<OutboundPage />} />
                <Route path="scanning" element={<InboundScanning />} />
                <Route path="picking" element={<PickingPage />} />
                <Route path="put-away" element={<PutAwayPage />} />
                <Route
                  path="picking-instruction/:orderId"
                  element={<PickingInstructionPage />}
                />
                <Route
                  path="outbound/:id/details"
                  element={<OutboundPickingPage />}
                />
              </Route>

              {/* 4. ACCOUNTANT ROUTES */}
              <Route
                path="/accountant"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.ACCOUNTANT]}>
                    <AccountantLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<AccountantDashboard />} />
                <Route path="invoices" element={<InvoicePage />} />
              </Route>

              {/* Redirect root (/) based on role handled in Index page or Redirect logic */}
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
        </AuthInitializer>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
