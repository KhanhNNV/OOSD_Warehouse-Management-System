import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/services/auth.service";
import { LoginCredentials, RegisterData, User } from "@/types/auth";
import { authUtils } from "@/utils/auth";

export const useAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sử dụng authUtils.getCurrentUser() thay vì parseJwt
  const [user, setUser] = useState<User | null>(() => {
    return authUtils.getCurrentUser();
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

  // --- LOGIN ---
  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(credentials);

      // Sử dụng authUtils để get user và redirect
      const decodedUser = authUtils.getCurrentUser();

      if (decodedUser) {
        setUser(decodedUser);
        setIsAuthenticated(true);

        // Điều hướng dựa trên Role
        const redirectPath = authUtils.getRoleHomePath(decodedUser.role);
        navigate(redirectPath);
      } else {
        setError("Token không hợp lệ");
        navigate("/login");
      }
    } catch (err: any) {
      console.error(err);
      const message = err.response?.data?.message || "Đăng nhập thất bại";
      setError(message);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REGISTER ---
  const register = async (info: RegisterData) => {
    setIsLoading(true);
    setError(null);
    try {
      await authService.register(info);
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
      navigate("/login");
    } catch (err: any) {
      console.error(err);
      const msg =
        err.response?.data?.message || "Đăng ký thất bại, vui lòng thử lại.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGOUT ---
  const logout = () => {
    authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    // Note: authService.logout() đã redirect về /login
  };

  // ✅ SWITCH ACCOUNT (Đổi tài khoản)
  const switchAccount = () => {
    authUtils.clearAuth();
    setUser(null);
    setIsAuthenticated(false);
    navigate("/login");
  };

  return {
    user,
    login,
    register,
    logout,
    switchAccount,
    isLoading,
    isAuthenticated,
    error,
  };
};
