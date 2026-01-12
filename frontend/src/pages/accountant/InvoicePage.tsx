// src/pages/accountant/InvoicePage.tsx
import React, { useEffect, useState } from 'react';
import { Eye } from 'lucide-react'; // Import icon con mắt
import { invoiceService } from '../../services/invoice.service';
import { Invoice } from '../../types/invoice';
// Import Modal chi tiết (đảm bảo file này nằm cùng thư mục)
import { InvoiceDetailModal } from "./InvoiceDetailModal";


const InvoicePage = () => {
    // 1. STATE CHO PHẦN TẠO HÓA ĐƠN (Code cũ của bạn)
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // 2. STATE CHO PHẦN DANH SÁCH HÓA ĐƠN (Code mới thêm)
    const [invoices, setInvoices] = useState<Invoice[]>([]);

    // 3. STATE CHO MODAL XEM CHI TIẾT
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);


    // Load dữ liệu khi vào trang
    useEffect(() => {
        fetchPackedOrders(); // Lấy đơn chờ
        fetchInvoices();     // Lấy lịch sử hóa đơn
    }, []);

    // --- CÁC HÀM XỬ LÝ ---

    const fetchPackedOrders = async () => {
        try {
            const data = await invoiceService.getPackedOrders();
            setOrders(data);
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        }
    };

    // Hàm mới: Lấy danh sách hóa đơn đã tạo
    const fetchInvoices = async () => {
        try {
            // Giả sử service bạn có hàm lấy tất cả hóa đơn.
            // Nếu chưa có, bạn cần thêm getAllInvoices() vào invoice.service.ts
            // Tạm thời mình để try/catch để không crash nếu chưa có API
            const data = await invoiceService.getAllInvoices();
            setInvoices(data);
        } catch (error) {
            console.log("Chưa có API lấy danh sách hóa đơn hoặc lỗi mạng");
        }
    };

    const handleCreateInvoice = async (orderId: number) => {
        if (!window.confirm('Xác nhận xuất hóa đơn cho đơn hàng này?')) return;

        setLoading(true);
        try {
            const result = await invoiceService.createInvoice({ outboundOrderId: orderId });
            alert('✅ Tạo hóa đơn thành công: ' + result.invoiceNumber);

            // Reload lại cả 2 bảng
            fetchPackedOrders(); // Đơn hàng sẽ biến mất khỏi bảng trên
            fetchInvoices();     // Hóa đơn mới sẽ hiện ở bảng dưới
        } catch (error: any) {
            alert('❌ Lỗi: ' + (error.response?.data?.message || 'Có lỗi xảy ra'));
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý khi bấm nút Con Mắt (Xem chi tiết)
    const handleViewDetail = async (id: number) => {
        try {
            const data = await invoiceService.getInvoiceById(id);
            setSelectedInvoice(data);
            setIsDetailOpen(true);
        } catch (error) {
            alert("Không thể tải chi tiết hóa đơn");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-8">
            <h1 className="text-2xl font-bold text-blue-700">🧾 Kế Toán - Quản Lý Hóa Đơn</h1>

            {/* --- PHẦN 1: ĐƠN HÀNG CHỜ XỬ LÝ (Code cũ của bạn) --- */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-blue-100">
                <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                        📦 Đơn hàng chờ xuất hóa đơn
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
                    </h3>
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
                                        className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:bg-gray-400 transition shadow-sm"
                                    >
                                        {loading ? '...' : 'Tạo Hóa Đơn'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                                Hiện không có đơn hàng nào cần xử lý.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- PHẦN 2: LỊCH SỬ HÓA ĐƠN (Phần mới thêm vào) --- */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-800">📜 Lịch sử hóa đơn đã lập</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                    <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                        <th className="p-4 border-b">Số Hóa Đơn</th>
                        <th className="p-4 border-b">Khách Hàng</th>
                        <th className="p-4 border-b">Tổng Tiền</th>
                        <th className="p-4 border-b">Trạng Thái</th>
                        <th className="p-4 border-b text-right">Chi Tiết</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoices.length > 0 ? (
                        invoices.map((inv) => (
                            <tr key={inv.id} className="hover:bg-gray-50 border-b last:border-0">
                                <td className="p-4 font-medium text-blue-600">{inv.invoiceNumber}</td>
                                <td className="p-4">{inv.customer?.name}</td>
                                <td className="p-4 font-medium text-gray-900">
                                    {formatCurrency(inv.finalAmount)}
                                </td>
                                <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                            inv.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {inv.status}
                                        </span>
                                </td>
                                <td className="p-4 text-right">
                                    {/* NÚT CON MẮT GỌI MODAL */}
                                    <button
                                        onClick={() => handleViewDetail(inv.id)}
                                        className="text-gray-500 hover:text-blue-600 transition p-1 rounded hover:bg-blue-50"
                                        title="Xem chi tiết"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                                Chưa có hóa đơn nào được tạo.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL (Ẩn, chỉ hiện khi bấm nút con mắt) --- */}
            <InvoiceDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default InvoicePage;