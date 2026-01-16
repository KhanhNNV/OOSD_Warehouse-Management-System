// src/components/AuthInitializer.tsx
import { useEffect, useState } from "react";
import { authUtils } from "@/utils/auth";
import { authService } from "@/services/auth.service";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("accessToken");

            // 1. Nếu không có token -> Không làm gì cả, để App tự xử lý (sẽ redirect login)
            if (!token) {
                setIsChecking(false);
                return;
            }

            // 2. Nếu có token nhưng ĐÃ HẾT HẠN
            if (authUtils.isTokenExpired()) {
                try {
                    console.log("Token hết hạn lúc khởi động. Đang thử Refresh...");
                    // Gọi API Refresh Token chủ động
                    await authService.refreshToken();

                    // Nếu thành công: Token mới đã được lưu vào localStorage (trong authService)
                    // App sẽ reload hoặc re-render với token mới hợp lệ.
                    console.log("Refresh thành công! Tiếp tục vào App.");
                } catch (error) {
                    console.error("Refresh thất bại, buộc phải Login lại.");
                    // Xóa token rác
                    localStorage.removeItem("accessToken");
                }
            }

            // 3. Kết thúc kiểm tra
            setIsChecking(false);
        };

        initializeAuth();
    }, []);

    if (isChecking) {
        // Hiển thị màn hình loading trắng hoặc Spinner trong khi đang check refresh
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500">Đang kiểm tra thông tin đăng nhập...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}