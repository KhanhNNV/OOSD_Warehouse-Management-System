// src/pages/accountant/InvoicePage.tsx
import React, { useEffect, useState } from 'react';
import { invoiceService } from '../../services/invoice.service';
import { Invoice } from '../../types/invoice';

const InvoicePage = () => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [createdInvoice, setCreatedInvoice] = useState<Invoice | null>(null);

    // Load danh sách khi vào trang
    useEffect(() => {
        fetchPackedOrders();
    }, []);

    const fetchPackedOrders = async () => {
        try {
            const data = await invoiceService.getPackedOrders();
            setOrders(data);
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        }
    };

    const handleCreateInvoice = async (orderId: number) => {
        if (!window.confirm('Xác nhận xuất hóa đơn cho đơn hàng này?')) return;

        setLoading(true);
        try {
            const result = await invoiceService.createInvoice({ outboundOrderId: orderId });
            setCreatedInvoice(result);
            alert('✅ Tạo hóa đơn thành công!');

            // Reload lại danh sách (đơn vừa tạo sẽ mất vì chuyển sang SHIPPED)
            fetchPackedOrders();
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        } finally {
            setLoading(false);
        }
    };

    // Hàm format tiền VND
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold text-blue-700 mb-6">🧾 Kế Toán - Lập Hóa Đơn (VAT 8%)</h1>

            {/* Bảng danh sách đơn hàng chờ xuất hóa đơn */}
            <div className="bg-white shadow rounded-lg overflow-hidden mb-8">
                <div className="p-4 border-b bg-blue-50">
                    <h3 className="font-semibold text-blue-800">Danh sách đơn hàng đã đóng gói (PACKED)</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <th className="p-4 border-b">Mã Đơn</th>
                        <th className="p-4 border-b">Khách Hàng</th>
                        <th className="p-4 border-b">Ngày Tạo</th>
                        <th className="p-4 border-b text-center">Hành Động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 border-b last:border-0">
                                <td className="p-4 font-medium">{order.orderNumber}</td>
                                <td className="p-4">{order.customer?.name || 'Khách lẻ'}</td>
                                <td className="p-4">{new Date(order.createdDate).toLocaleDateString('vi-VN')}</td>
                                <td className="p-4 text-center">
                                    <button
                                        onClick={() => handleCreateInvoice(order.id)}
                                        disabled={loading}
                                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 transition"
                                    >
                                        {loading ? 'Đang xử lý...' : 'Xuất Hóa Đơn'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-500">
                                Không có đơn hàng nào cần xử lý.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* Phần hiển thị kết quả Hóa đơn vừa tạo */}
            {createdInvoice && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 shadow-sm animate-fade-in-down">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
                                ✅ Hóa Đơn: {createdInvoice.invoiceNumber}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Khách hàng: <span className="font-medium">{createdInvoice.customer?.name}</span>
                            </p>
                            <p className="text-sm text-gray-600">
                                Người lập: <span className="font-medium">{createdInvoice.staff?.fullName}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded border border-red-400">
                                {createdInvoice.status}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-green-200 pt-4 space-y-2">
                        <div className="flex justify-between text-gray-700">
                            <span>Tổng tiền hàng:</span>
                            <span>{formatCurrency(createdInvoice.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-gray-700">
                            <span>Thuế GTGT (8%):</span>
                            <span>{formatCurrency(createdInvoice.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-red-600 border-t border-dashed border-green-300 pt-2 mt-2">
                            <span>Tổng thanh toán:</span>
                            <span>{formatCurrency(createdInvoice.finalAmount)}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvoicePage;