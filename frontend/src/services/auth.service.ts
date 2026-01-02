// src/services/auth.service.ts
import api from "./api";
import { LoginCredentials, RegisterData, User, UserRole,RefreshTokenResponse } from "@/types/auth";
import { parseJwt } from "@/utils/jwt";

export const authService = {
    // ✅ Sử dụng LoginCredentials đã định nghĩa
    async login(credentials: LoginCredentials) {
        const response = await api.post("/auth/login", credentials);
        const { accessToken, refreshToken } = response.data;

        if (accessToken) {
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
        }
        return response.data;
    },

    async refreshToken(): Promise<RefreshTokenResponse | null> {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) return null;

        try {
            // Gọi endpoint backend vừa tạo
            const response = await api.post("/auth/refresh", { refreshToken });
            const { accessToken, refreshToken: newRefreshToken } = response.data;

            // Lưu lại vào storage
            localStorage.setItem("accessToken", accessToken);
            if (newRefreshToken) {
                localStorage.setItem("refreshToken", newRefreshToken);
            }

            return response.data;
        } catch (error) {
            console.error("Refresh token failed", error);
            return null;
        }
    },

    logout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
    },

    getCurrentUser(): User | null {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        return parseJwt(token);
    },

    getRole(): UserRole | null {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    isAuthenticated(): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;

        // Kiểm tra hết hạn token (nếu có trường exp)
        if (user.exp && user.exp * 1000 < Date.now()) {
            this.logout();
            return false;
        }
        return true;
    },
};