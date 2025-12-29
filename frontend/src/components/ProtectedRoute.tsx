// src/components/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { UserRole } from "@/types/auth";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    allowedRoles?: UserRole[];
    children?: ReactNode; //
}

export const ProtectedRoute = ({ allowedRoles, children }: ProtectedRouteProps) => {
    const isAuth = authService.isAuthenticated();
    const userRole = authService.getRole();
    const location = useLocation();

    // 1. Chưa đăng nhập -> Login
    if (!isAuth || !userRole) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Role là NONE -> Chuyển đến trang chờ
    if (userRole === UserRole.NONE) {
        if (location.pathname === "/pending-approval") {
            // Nếu dùng children thì render children, không thì Outlet (để tránh lỗi vòng lặp)
            return children ? <>{children}</> : <Outlet />;
        }
        return <Navigate to="/pending-approval" replace />;
    }

    // 3. Sai Role -> 403 / Unauthorized
    if (allowedRoles && !allowedRoles.includes(userRole)) {
        return <Navigate to="/unauthorized" replace />;
    }

    // 4. Hợp lệ:
    // Nếu có children (ví dụ StaffLayout) thì render children.
    // Nếu không có children (dùng kiểu cũ) thì render Outlet.
    return children ? <>{children}</> : <Outlet />;
};