import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import { LoginCredentials, RegisterData, UserRole, User } from '@/types/auth'; // Đảm bảo import type User
import { parseJwt } from '@/utils/jwt';

export const useAuth = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 1. State lưu thông tin User hiện tại
    // Khởi tạo lười (lazy initialization) để chỉ đọc localStorage 1 lần khi mount
    const [user, setUser] = useState<User | null>(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                return parseJwt(token);
            } catch (e) {
                return null;
            }
        }
        return null;
    });

    // State xác thực (có thể suy ra từ user, nhưng giữ riêng nếu muốn tách biệt logic)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(!!user);

    // --- XỬ LÝ LOGIN VÀ ĐIỀU HƯỚNG ---
    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await authService.login(credentials);

            // 2. Cập nhật User State ngay sau khi login thành công
            const decodedUser = parseJwt(data.accessToken);

            if (decodedUser) {
                setUser(decodedUser);
                setIsAuthenticated(true);

                // 3. Điều hướng dựa trên Role
                switch (decodedUser.role) {
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
                        navigate('/unauthorized');
                }
            } else {
                setError("Token không hợp lệ");
                navigate('/');
            }

        } catch (err: any) {
            console.error(err);
            const message = err.response?.data?.message || 'Đăng nhập thất bại';
            setError(message);
            setIsAuthenticated(false);
            setUser(null);
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
        // 4. Xóa state User khi logout
        setUser(null);
        setIsAuthenticated(false);
        navigate('/login');
    };

    return {
        user, // Trả về object user để các component khác sử dụng
        login,
        register,
        logout,
        isLoading,
        isAuthenticated,
        error
    };
};