// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types/auth"; // Import Enum

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
import InboundPage from "@/pages/staff/Inbound.tsx";
import OutboundPage from "@/pages/staff/Outbound.tsx";
import Dashboard from "@/pages/admin/Dashboard.tsx";
import CreateUserPage from "@/pages/admin/CreateUser.tsx";
import Register from "@/pages/auth/RegisterPage.tsx";
import InboundScanning from "@/pages/staff/InboundScanning";
import InboundPageManager from "@/pages/manager/InboundPage.tsx";
// Dashboard Pages (Ví dụ)
import AdminDashboard from "./pages/admin/Dashboard";
import ManagerDashboard from "./pages/manager/Dashboard";
import StaffDashboard from "./pages/staff/Dashboard";
import AccountantDashboard from "./pages/accountant/Dashboard";
import { Settings } from "lucide-react";
import SettingsPage from "@/pages/admin/Settings.tsx";
import AuthPage from "@/pages/auth/AuthPage.tsx";
import MasterDataPage from "./pages/admin/MasterDataPage.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<AuthPage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/register" element={<Register />} />

        {/* Route dành riêng cho user chưa được duyệt (Role = NONE) */}
        {/* Chúng ta bọc nó trong ProtectedRoute để đảm bảo phải login mới thấy trang này,
            nhưng không truyền allowedRoles để nó tự lọt vào logic check NONE bên trong */}
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
          <Route path="users" element={<CreateUserPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="master-data" element={<MasterDataPage />} />

          {/* Các route con của admin */}
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
          <Route path="inbound" element={<InboundPageManager />} />
          <Route path="outbound" element={<OutboundPage />} />
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
          <Route path="inbound" element={<InboundPage />} />
          <Route path="outbound" element={<OutboundPage />} />
          <Route path="scan-test" element={<InboundScanning />} />
        </Route>

        {/* 4. ACCOUNTANT ROUTES */}
        <Route
          path="/accountant"
          element={
            <ProtectedRoute allowedRoles={[UserRole.ACCOUNTANT]}>
              <StaffLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AccountantDashboard />} />
        </Route>

        {/* Redirect root (/) based on role handled in Index page or Redirect logic */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
