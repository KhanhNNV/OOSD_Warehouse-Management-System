// src/services/auth.service.ts
import api from "./api";
import { LoginCredentials, RegisterData, User, UserRole } from "@/types/auth";
import { parseJwt } from "@/utils/jwt";

export const authService = {
    /**
     * Đăng nhập người dùng.
     * Lưu ý: Refresh Token sẽ được Backend tự động set vào HttpOnly Cookie.
     * Client chỉ cần nhận và lưu Access Token.
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
     * Gọi API để Backend xóa Cookie Refresh Token, sau đó xóa Access Token ở Client.
     */
    async logout() {
        try {
            await api.post("/auth/logout");
        } catch (e) {
            // Vẫn tiếp tục xóa LocalStorage dù API lỗi để đảm bảo user thoát được UI
            console.error("Logout error", e);
        }
        localStorage.removeItem("accessToken");
        // Reload lại trang để reset toàn bộ state của ứng dụng (Redux/Context/Query)
        window.location.href = "/login";
    },

    /**
     * Lấy thông tin User hiện tại bằng cách giải mã Access Token (JWT).
     * Không gọi API, chỉ decode chuỗi token offline.
     */
    getCurrentUser(): User | null {
        const token = localStorage.getItem("accessToken");
        if (!token) return null;
        try {
            return parseJwt(token);
        } catch (error) {
            return null; // Token lỗi format
        }
    },

    /**
     * Lấy Role của user (ví dụ: ADMIN, USER).
     * Dùng để phân quyền hiển thị menu/route.
     */
    getRole(): UserRole | null {
        const user = this.getCurrentUser();
        return user ? user.role : null;
    },

    /**
     * Kiểm tra nhanh user đã đăng nhập chưa.
     * Chỉ kiểm tra sự tồn tại của Access Token (chưa kiểm tra hết hạn).
     */
    isAuthenticated(): boolean {
        const user = this.getCurrentUser();
        return !!user;
    },
};