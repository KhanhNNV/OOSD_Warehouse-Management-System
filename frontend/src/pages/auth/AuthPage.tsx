import React, { useState, useEffect } from 'react';
import { User, Lock, Phone, Mail, Eye, EyeOff } from 'lucide-react';
// 1. Import hook
import { useAuth } from "@/hooks/useAuth";

const AuthPage = () => {
    // 2. Sử dụng hook useAuth
    // Lưu ý: Chúng ta gộp login và register vào một lần gọi hook để chia sẻ state isLoading và error
    const { login, register, isLoading, error } = useAuth();

    const [isLogin, setIsLogin] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State riêng để xử lý lỗi validation phía client (VD: mật khẩu không khớp)
    const [validationError, setValidationError] = useState('');

    const [loginData, setLoginData] = useState({
        username: '',
        password: ''
    });

    const [registerData, setRegisterData] = useState({
        username: '',
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: ''
    });

    // Reset lỗi validation khi API trả về lỗi mới hoặc khi user nhập liệu
    useEffect(() => {
        if (error) setValidationError('');
    }, [error]);

    const handleLoginChange = (e) => {
        setLoginData({ ...loginData, [e.target.name]: e.target.value });
        setValidationError(''); // Xóa lỗi client khi nhập
    };

    const handleRegisterChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
        setValidationError(''); // Xóa lỗi client khi nhập
    };

    const handleLoginSubmit = async () => {
        setValidationError('');
        // Gọi hàm login từ hook
        try {
            await login(loginData);
            // Việc điều hướng (navigate) thường được xử lý bên trong hook sau khi thành công
            // hoặc bạn có thể thêm logic ở đây nếu hook trả về Promise
        } catch (err) {
            // Error state đã được hook xử lý tự động
            console.error(err);
        }
    };

    const handleRegisterSubmit = async () => {
        setValidationError('');

        // Validation phía Client
        if (registerData.password !== registerData.confirmPassword) {
            setValidationError('Mật khẩu xác nhận không khớp!');
            return;
        }

        // Gọi hàm register từ hook
        try {
            // Loại bỏ confirmPassword trước khi gửi lên API nếu cần
            const { confirmPassword, ...payload } = registerData;
            await register(payload);
        } catch (err) {
            console.error(err);
        }
    };

    const toggleForm = () => {
        setIsLogin(!isLogin);
        setValidationError('');
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    // Ưu tiên hiển thị lỗi từ API (error), nếu không có thì hiển thị lỗi validation client
    const displayError = error || validationError;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header with Toggle */}
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
                        <h1 className="text-3xl font-bold text-center mb-2">
                            {isLogin ? 'Chào Mừng Trở Lại' : 'Tạo Tài Khoản'}
                        </h1>
                        <p className="text-center text-blue-100">
                            {isLogin ? 'Đăng nhập để tiếp tục' : 'Đăng ký để bắt đầu'}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div className="p-8">
                        {/* Error Message */}
                        {displayError && (
                            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded">
                                {displayError}
                            </div>
                        )}

                        {/* Login Form */}
                        {isLogin ? (
                            <div className="space-y-5">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên đăng nhập
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={loginData.username}
                                            onChange={handleLoginChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Nhập tên đăng nhập"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={loginData.password}
                                            onChange={handleLoginChange}
                                            className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Nhập mật khẩu"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password */}
                                <div className="flex justify-end">
                                    <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                        Quên mật khẩu?
                                    </button>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleLoginSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </span>
                                    ) : 'Đăng Nhập'}
                                </button>
                            </div>
                        ) : (
                            /* Register Form */
                            <div className="space-y-5">
                                {/* Username */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên đăng nhập
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="username"
                                            value={registerData.username}
                                            onChange={handleRegisterChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Chọn tên đăng nhập"
                                        />
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Họ và tên
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            name="fullName"
                                            value={registerData.fullName}
                                            onChange={handleRegisterChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Nhập họ và tên"
                                        />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Số điện thoại
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="tel"
                                            name="phoneNumber"
                                            value={registerData.phoneNumber}
                                            onChange={handleRegisterChange}
                                            className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Nhập số điện thoại"
                                        />
                                    </div>
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Mật khẩu
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={registerData.password}
                                            onChange={handleRegisterChange}
                                            className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Tạo mật khẩu"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Xác nhận mật khẩu
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            name="confirmPassword"
                                            value={registerData.confirmPassword}
                                            onChange={handleRegisterChange}
                                            className="w-full pl-11 pr-11 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                            placeholder="Nhập lại mật khẩu"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <button
                                    onClick={handleRegisterSubmit}
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 shadow-lg"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Đang xử lý...
                                        </span>
                                    ) : 'Đăng Ký'}
                                </button>
                            </div>
                        )}

                        {/* Toggle Between Login/Register */}
                        <div className="mt-6 text-center">
                            <p className="text-gray-600">
                                {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                                <button
                                    onClick={toggleForm}
                                    className="ml-2 text-blue-600 font-semibold hover:text-blue-800 hover:underline focus:outline-none"
                                >
                                    {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
                                </button>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-gray-500 text-sm mt-6">
                    © 2026 - Bảo mật và an toàn
                </p>
            </div>
        </div>
    );
};

export default AuthPage;