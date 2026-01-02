import React from 'react';
import { Clock, Mail, LogOut } from 'lucide-react';
import {useAuth} from "@/hooks/useAuth.ts";

const PendingApproval = () => {

    const { logout } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8 text-white">
                        <div className="flex justify-center mb-4">
                            <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                                <Clock className="w-12 h-12" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-center mb-2">
                            Chờ Xác Nhận
                        </h1>
                        <p className="text-center text-yellow-100">
                            Tài khoản đang được xem xét
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Status Message */}
                        <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded">
                            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                                Tài khoản đang chờ duyệt
                            </h2>
                            <p className="text-gray-700 leading-relaxed">
                                Cảm ơn bạn đã đăng ký! Tài khoản của bạn hiện đang ở trạng thái chờ duyệt.
                                Vui lòng đợi Quản trị viên phân quyền để truy cập hệ thống.
                            </p>
                        </div>

                        {/* Steps Indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold mb-2">
                                        ✓
                                    </div>
                                    <span className="text-xs text-gray-600 text-center">Đăng ký</span>
                                </div>
                                <div className="flex-1 h-1 bg-yellow-300 mx-2"></div>
                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold mb-2 animate-pulse">
                                        2
                                    </div>
                                    <span className="text-xs text-gray-600 text-center">Chờ duyệt</span>
                                </div>
                                <div className="flex-1 h-1 bg-gray-300 mx-2"></div>
                                <div className="flex flex-col items-center flex-1">
                                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-white font-bold mb-2">
                                        3
                                    </div>
                                    <span className="text-xs text-gray-600 text-center">Hoàn tất</span>
                                </div>
                            </div>
                        </div>

                        {/* Help Text */}
                        <p className="text-sm text-gray-500 text-center mb-6">
                            Nếu bạn cho rằng đây là sự nhầm lẫn, vui lòng liên hệ bộ phận hỗ trợ tại{' '}
                            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                                support@example.com
                            </a>
                        </p>

                        {/* Logout Button */}
                        <button
                            onClick={logout}
                            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 hover:border-gray-400 focus:ring-4 focus:ring-gray-200 transition duration-200 flex items-center justify-center"
                        >
                            <LogOut className="w-5 h-5 mr-2" />
                            Đăng Xuất
                        </button>
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

export default PendingApproval;