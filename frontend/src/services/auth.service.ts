import api from "./api";
import { LoginCredentials, RegisterData, User, UserRole } from "@/types/auth";
import { parseJwt } from "@/utils/jwt";

export const authService = {
  /**
   * Đăng nhập người dùng.
   */
  async login(credentials: LoginCredentials) {
    const response = await api.post("/auth/login", credentials);
    const { accessToken } = response.data;

    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }
    return response.data;
  },

  /**
   * Đăng ký tài khoản mới.
   */
  async register(data: RegisterData) {
    return await api.post("/auth/register", data);
  },

  /**
   * Đăng xuất.
   * Gọi API để Backend xóa Cookie Refresh Token.
   */
  async logout() {
    try {
      await api.post("/auth/logout");
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.removeItem("accessToken");
    // Redirect to login
    window.location.href = "/login";
  },

  /**
   * Lấy thông tin User hiện tại từ token.
   */
  getCurrentUser(): User | null {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      return parseJwt(token);
    } catch (error) {
      return null;
    }
  },

  /**
   * Lấy Role của user.
   */
  getRole(): UserRole | null {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  },

  /**
   * Kiểm tra user đã đăng nhập chưa.
   */
  isAuthenticated(): boolean {
    const user = this.getCurrentUser();
    return !!user;
  },
};
