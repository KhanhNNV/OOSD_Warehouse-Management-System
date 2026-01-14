import { User, UserRole } from "@/types/auth";
import { parseJwt } from "./jwt"; // ✅ Import parseJwt có sẵn

export const authUtils = {
  /**
   * Get current logged in user from localStorage token
   * ✅ Sử dụng parseJwt có sẵn thay vì duplicate code
   */
  getCurrentUser: (): User | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const user = parseJwt(token);

      // ✅ Thêm check token expiration
      if (user && user.exp) {
        const now = Math.floor(Date.now() / 1000); // Current time in seconds
        if (user.exp < now) {
          console.log("Token đã hết hạn");
          return null;
        }
      }

      return user;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  },

  /**
   * Clear all auth data
   */
  clearAuth: () => {
    localStorage.removeItem("accessToken");
  },

  /**
   * Get redirect path based on role
   */
  getRoleHomePath: (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return "/admin";
      case UserRole.MANAGER:
        return "/manager";
      case UserRole.ACCOUNTANT:
        return "/accountant";
      case UserRole.STAFF:
        return "/staff";
      case UserRole.NONE:
        return "/pending-approval";
      default:
        return "/unauthorized";
    }
  },

  /**
   * Get role display name in Vietnamese
   */
  getRoleLabel: (role: UserRole): string => {
    switch (role) {
      case UserRole.ADMIN:
        return "Quản trị viên";
      case UserRole.MANAGER:
        return "Quản lý kho";
      case UserRole.ACCOUNTANT:
        return "Kế toán";
      case UserRole.STAFF:
        return "Nhân viên kho";
      case UserRole.NONE:
        return "Chờ phê duyệt";
      default:
        return "Người dùng";
    }
  },

  /**
   * Check if token is expired
   */
  isTokenExpired: (): boolean => {
    const user = authUtils.getCurrentUser();
    if (!user || !user.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return user.exp < now;
  },

  /**
   * Get time until token expires (in seconds)
   */
  getTokenExpiresIn: (): number | null => {
    const user = authUtils.getCurrentUser();
    if (!user || !user.exp) return null;

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = user.exp - now;
    return expiresIn > 0 ? expiresIn : 0;
  },
};
