// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { UserRole } from "@/types/auth"; // Import Enum

// Layouts
import { AppLayout } from "./components/layout/AppLayout";
// import { ManagerLayout } from "./layouts/ManagerLayout";
// import { StaffLayout } from "./layouts/StaffLayout";
// import { AccountantLayout } from "./layouts/AccountantLayout";

// Components & Pages
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/auth/LoginPage";
import PendingApproval from "./pages/PendingApproval";
import Unauthorized from "./pages/PendingApproval";
import NotFound from "./pages/NotFound";
import InboundPage from "@/pages/Inbound.tsx";
import OutboundPage from "@/pages/Outbound.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import CreateUserPage from "@/pages/admin/CreateUser.tsx";
import Register from "@/pages/auth/RegisterPage.tsx";

// Dashboard Pages (Ví dụ)
// import AdminDashboard from "./pages/admin/Dashboard";
// import ManagerDashboard from "./pages/manager/Dashboard";
// import StaffDashboard from "./pages/staff/Dashboard";
// import AccountantDashboard from "./pages/accountant/Dashboard";

const queryClient = new QueryClient();

const App = () => (
    <QueryClientProvider client={queryClient}>
        <Toaster />
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/unauthorized" element={<Unauthorized />} />
                <Route path="/register" element={<Register/>} />

                {/* Route dành riêng cho user chưa được duyệt (Role = NONE) */}
                {/* Chúng ta bọc nó trong ProtectedRoute để đảm bảo phải login mới thấy trang này,
            nhưng không truyền allowedRoles để nó tự lọt vào logic check NONE bên trong */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/pending-approval" element={<PendingApproval />} />
                </Route>

                {/* 1. ADMIN ROUTES */}
                <Route path="/" element={
                    <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                        <AppLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Dashboard />} />
                    <Route path="/inbound" element={<InboundPage/>} />
                    <Route path="/outbound" element={<OutboundPage />} />
                    <Route path="/users/create" element={<CreateUserPage />} />

                    {/* Các route con của admin */}
                </Route>

                {/*/!* 2. MANAGER ROUTES *!/*/}
                {/*<Route path="/dashboard/manager" element={*/}
                {/*    <ProtectedRoute allowedRoles={[UserRole.MANAGER]}>*/}
                {/*        <ManagerLayout />*/}
                {/*    </ProtectedRoute>*/}
                {/*}>*/}
                {/*    <Route index element={<ManagerDashboard />} />*/}
                {/*</Route>*/}

                {/*/!* 3. STAFF ROUTES *!/*/}
                {/*<Route path="/dashboard/staff" element={*/}
                {/*    <ProtectedRoute allowedRoles={[UserRole.STAFF]}>*/}
                {/*        <StaffLayout />*/}
                {/*    </ProtectedRoute>*/}
                {/*}>*/}
                {/*    <Route index element={<StaffDashboard />} />*/}
                {/*</Route>*/}

                {/*/!* 4. ACCOUNTANT ROUTES *!/*/}
                {/*<Route path="/dashboard/accountant" element={*/}
                {/*    <ProtectedRoute allowedRoles={[UserRole.ACCOUNTANT]}>*/}
                {/*        <AccountantLayout />*/}
                {/*    </ProtectedRoute>*/}
                {/*}>*/}
                {/*    <Route index element={<AccountantDashboard />} />*/}
                {/*</Route>*/}

                {/* Redirect root (/) based on role handled in Index page or Redirect logic */}
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<NotFound />} />
            </Routes>
        </BrowserRouter>
    </QueryClientProvider>
);

export default App;