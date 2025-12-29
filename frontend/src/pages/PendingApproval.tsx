// src/pages/PendingApproval.tsx
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/button";

const PendingApproval = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
                <h1 className="text-2xl font-bold text-yellow-600 mb-4">
                    Tài khoản đang chờ duyệt
                </h1>
                <p className="text-gray-600 mb-6">
                    Cảm ơn bạn đã đăng ký. Tài khoản của bạn hiện đang ở trạng thái
                    <span className="font-bold"> NONE</span>.
                    Vui lòng đợi Quản trị viên (Admin) xét duyệt và phân quyền để truy cập hệ thống.
                </p>
                <p className="text-sm text-gray-400 mb-6">
                    Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ.
                </p>

                <Button onClick={() => authService.logout()} variant="outline">
                    Đăng xuất
                </Button>
            </div>
        </div>
    );
};

export default PendingApproval;