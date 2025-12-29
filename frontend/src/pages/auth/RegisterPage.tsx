// src/pages/auth/RegisterPage.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth"; // Gọi Hook
import { RegisterData } from "@/types/auth"; // Gọi Type

const RegisterPage = () => {
    // 1. Lấy logic từ Hook
    const { register, isLoading, error: apiError } = useAuth();

    // 2. State nội bộ của UI (những cái API không cần biết, ví dụ confirmPassword)
    const [formData, setFormData] = useState({
        username: "",
        fullName: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
    });
    const [uiError, setUiError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setUiError(null); // Reset lỗi UI khi gõ
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate UI (Logic hiển thị)
        if (formData.password !== formData.confirmPassword) {
            setUiError("Mật khẩu xác nhận không khớp!");
            return;
        }

        // Chuẩn bị dữ liệu đúng chuẩn Type để gửi đi
        const payload: RegisterData = {
            username: formData.username,
            password: formData.password,
            fullName: formData.fullName,
            phoneNumber: formData.phoneNumber,
        };

        // Gọi hàm register từ Hook
        await register(payload);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold text-center mb-6">Đăng Ký</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Hiển thị lỗi: Ưu tiên lỗi API, nếu không có thì hiện lỗi UI */}
                    {(apiError || uiError) && (
                        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
                            {apiError || uiError}
                        </div>
                    )}

                    {/* Các input form... */}
                    <input
                        name="username"
                        placeholder="Tên đăng nhập"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                        required
                    />

                    <input
                        name="fullName"
                        placeholder="Họ và tên"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                        required
                    />

                    <input
                        name="phoneNumber"
                        placeholder="Số điện thoại"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                    />

                    <input
                        type="password"
                        name="password"
                        placeholder="Mật khẩu"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                        required
                    />

                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Nhập lại mật khẩu"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border rounded focus:outline-blue-500"
                        required
                    />

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isLoading ? "Đang xử lý..." : "Đăng Ký"}
                    </button>
                </form>

                <div className="mt-4 text-center">
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Quay lại đăng nhập
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;