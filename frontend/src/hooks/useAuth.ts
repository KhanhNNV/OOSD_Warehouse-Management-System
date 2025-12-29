import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { LoginCredentials, RegisterData, UserRole } from '@/types/auth'; // Import UserRole
import { parseJwt } from '@/utils/jwt'; // ✅ Import hàm giải mã token

export const useAuth = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Kiểm tra token khởi tạo
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
        return !!localStorage.getItem('accessToken');
    });

    const navigate = useNavigate();

    // --- XỬ LÝ LOGIN VÀ ĐIỀU HƯỚNG ---
    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            // 1. Gọi API Login
            const data = await authService.login(credentials);

            // authService đã lưu token vào localStorage, ta không cần lưu lại
            // Cập nhật state xác thực
            setIsAuthenticated(true);

            // 2. Giải mã Token để lấy Role ngay lập tức
            const user = parseJwt(data.accessToken);

            if (user) {
                // 3. Điều hướng dựa trên Role
                switch (user.role) {
                    case UserRole.ADMIN:
                        navigate('/admin');
                        break;
                    case UserRole.MANAGER:
                        navigate('/manager');
                        break;
                    case UserRole.STAFF:
                        navigate('/staff');
                        break;
                    case UserRole.ACCOUNTANT:
                        navigate('/accountant');
                        break;
                    case UserRole.NONE:
                        navigate('/pending-approval');
                        break;
                    default:
                        // Trường hợp không xác định được role hoặc role lạ
                        navigate('/unauthorized');
                }
            } else {
                // Trường hợp có token nhưng không giải mã được
                navigate('/');
            }

        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Đăng nhập thất bại';
            setError(message);
            setIsAuthenticated(false);
        } finally {
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ REGISTER ---
    const register = async (info: RegisterData) => {
        setIsLoading(true);
        setError(null);
        try {
            await authService.register(info);
            // Giả sử đăng ký xong cần đăng nhập lại
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            const msg = err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại.';
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    // --- XỬ LÝ LOGOUT ---
    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
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