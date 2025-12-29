import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Đảm bảo đường dẫn import đúng (dùng @ nếu đã cấu hình alias, hoặc đường dẫn tương đối)
import { authService } from '@/services/auth.service';
import { LoginCredentials, RegisterData } from '@/types/auth';

export const useAuth = () => {
    // 1. State quản lý loading và error
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 2. State xác thực: Kiểm tra token ngay khi khởi tạo
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('accessToken');
    });

    const navigate = useNavigate();

    // --- XỬ LÝ LOGIN ---
    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            // Gọi service (service này đã lưu localStorage rồi)
            await authService.login(credentials);

            // Cập nhật state
            setIsAuthenticated(true);

            // Chuyển hướng
            // Lưu ý: Có thể check role ở đây để điều hướng trang admin/user khác nhau
            navigate('/');
        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Đăng nhập thất bại';
            setError(message);
            setIsAuthenticated(false);
            // Có thể dùng Toast/Sonner ở đây thay vì alert
            // toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ REGISTER ---

    const register = async (info: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Gọi Service
            await authService.register(info);

            // 2. Thành công -> Thông báo & Chuyển hướng
            // Tùy logic: Nếu register xong mà tự login luôn thì setAuth, còn không thì bắt login lại.
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');

        } catch (err: any) {
            console.error(err);
            // Lấy message lỗi từ Backend trả về
            const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };


    // --- XỬ LÝ LOGOUT ---
    const logout = () => {
        // Sửa lỗi: Dùng authService (chữ thường)
        authService.logout();

        // Cập nhật state nội bộ
        setIsAuthenticated(false);

        // Điều hướng
        navigate('/login');
    };

    return {
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
        error
    };
};