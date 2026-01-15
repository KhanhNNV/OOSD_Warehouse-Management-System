// src/pages/accountant/InvoicePage.tsx

import React, { useEffect, useState } from 'react';
import { Eye, FilePlus } from 'lucide-react'; // Import icon
import { invoiceService } from '../../services/invoice.service';
import { Invoice } from '../../types/invoice';
import { OrderDetailModal } from "./OrderDetailModal";

// 2. Modal xem hóa đơn (Đã tạo xong)
import { InvoiceDetailModal } from "./InvoiceDetailModal";

const InvoicePage = () => {
    // 1. STATE DỮ LIỆU
    const [orders, setOrders] = useState<any[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(false);

    // 2. STATE MODAL ĐƠN HÀNG (Mới thêm)
    const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

    // 3. STATE MODAL HÓA ĐƠN (Cũ)
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isInvoiceDetailOpen, setIsInvoiceDetailOpen] = useState(false);

    // Load dữ liệu khi vào trang
    useEffect(() => {
        fetchPackedOrders();
        fetchInvoices();
    }, []);

    // --- CÁC HÀM API ---
    const fetchPackedOrders = async () => {
        try {
            const data = await invoiceService.getPackedOrders();
            setOrders(data);
        } catch (error) {
            console.error("Lỗi tải đơn hàng:", error);
        }
    };

    const fetchInvoices = async () => {
        try {
            const data = await invoiceService.getAllInvoices();
            setInvoices(data);
        } catch (error) {
            console.log("Lỗi tải hóa đơn:", error);
        }
    };

    // --- HÀM XỬ LÝ SỰ KIỆN ---

    // 1. Mở Modal xem chi tiết đơn hàng
    const openOrderModal = (orderId: number) => {
        setSelectedOrderId(orderId);
        setIsOrderModalOpen(true);
    };

    // 2. Tạo hóa đơn (Gọi từ nút trên bảng hoặc từ trong Modal)
    const handleCreateInvoice = async (orderId: number) => {
        // Tắt confirm ở đây nếu muốn Modal xác nhận thay
        if (!window.confirm("Xác nhận tạo hóa đơn cho đơn hàng này?")) return;

        setLoading(true);
        try {
            await invoiceService.createInvoice({ outboundOrderId: orderId });
            alert("✅ Tạo hóa đơn thành công!");

            // Refresh dữ liệu
            fetchPackedOrders();
            fetchInvoices();
            setIsOrderModalOpen(false); // Đóng modal nếu đang mở
        } catch (error: any) {
            console.error("Lỗi tạo hóa đơn:", error);
            alert("❌ Lỗi: " + (error.response?.data?.message || "Có lỗi xảy ra"));
        } finally {
            setLoading(false);
        }
    };

    // 3. Mở Modal xem chi tiết hóa đơn cũ
    const openInvoiceModal = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsInvoiceDetailOpen(true);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen space-y-8">
            <h1 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
                🧾 Kế Toán - Quản Lý Hóa Đơn
            </h1>

            {/* --- PHẦN 1: ĐƠN HÀNG CHỜ XUẤT HÓA ĐƠN --- */}
            <div className="bg-white rounded-lg shadow border border-blue-100 overflow-hidden">
                <div className="p-4 border-b bg-blue-50 flex justify-between items-center">
                    <h3 className="font-bold text-blue-800 flex items-center gap-2">
                        📦 Đơn hàng chờ xuất hóa đơn
                        <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full">{orders.length}</span>
                    </h3>
                </div>

                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase">
                    <tr>
                        <th className="p-4 border-b">Mã đơn</th>
                        <th className="p-4 border-b">Khách hàng</th>
                        <th className="p-4 border-b">Ngày tạo</th>
                        <th className="p-4 border-b text-right">Hành động</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            <tr key={order.id} className="border-b hover:bg-gray-50 last:border-0">
                                <td className="p-4 font-medium text-gray-900">{order.orderNumber}</td>
                                <td className="p-4">{order.customerName || "Khách lẻ"}</td>
                                <td className="p-4">{new Date(order.createdDate).toLocaleDateString("vi-VN")}</td>
                                <td className="p-4 text-right flex justify-end gap-2">
                                    {/* Nút Xem (Mới thêm) */}
                                    <button
                                        onClick={() => openOrderModal(order.id)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center gap-1 transition shadow-sm"
                                        title="Xem chi tiết hàng hóa"
                                    >
                                        <Eye size={16} /> Xem
                                    </button>

                                    {/* Nút Tạo */}
                                    <button
                                        onClick={() => handleCreateInvoice(order.id)}
                                        disabled={loading}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 transition shadow-sm disabled:opacity-50"
                                    >
                                        <FilePlus size={16} />
                                        {loading ? '...' : 'Tạo HĐ'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-gray-400 italic">
                                Không có đơn hàng nào đang chờ xử lý.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- PHẦN 2: LỊCH SỬ HÓA ĐƠN --- */}
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="p-4 border-b bg-gray-50">
                    <h3 className="font-bold text-gray-800">📜 Lịch sử hóa đơn đã lập</h3>
                </div>
                <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-600 uppercase">
                    <tr>
                        <th className="p-4 border-b">Số hóa đơn</th>
                        <th className="p-4 border-b">Khách hàng</th>
                        <th className="p-4 border-b">Tổng tiền</th>
                        <th className="p-4 border-b">Trạng thái</th>
                        <th className="p-4 border-b text-right">Chi tiết</th>
                    </tr>
                    </thead>
                    <tbody>
                    {invoices.length > 0 ? (
                        invoices.map((inv) => (
                            <tr key={inv.id} className="border-b hover:bg-gray-50 last:border-0">
                                <td className="p-4 font-medium text-blue-600">{inv.invoiceNumber}</td>
                                <td className="p-4">{inv.customer?.name}</td>
                                <td className="p-4 font-bold text-gray-800">
                                    {formatCurrency(inv.finalAmount)}
                                </td>
                                <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold 
                                            ${inv.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {inv.status}
                                        </span>
                                </td>
                                <td className="p-4 text-right">
                                    <button
                                        onClick={() => openInvoiceModal(inv)}
                                        className="text-gray-500 hover:text-blue-600 transition p-1 rounded hover:bg-blue-50"
                                    >
                                        <Eye size={20} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={5} className="p-8 text-center text-gray-400 italic">
                                Chưa có hóa đơn nào được tạo.
                            </td>
                        </tr>
                    )}
                    </tbody>
                </table>
            </div>

            {/* --- MODAL 1: XEM CHI TIẾT ĐƠN HÀNG (Mới) --- */}
            <OrderDetailModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                orderId={selectedOrderId}
                onCreateInvoice={(order) => handleCreateInvoice(order.id)}
            />

            {/* --- MODAL 2: XEM CHI TIẾT HÓA ĐƠN (Cũ) --- */}
            <InvoiceDetailModal
                isOpen={isInvoiceDetailOpen}
                onClose={() => setIsInvoiceDetailOpen(false)}
                invoice={selectedInvoice}
            />
        </div>
    );
};

export default InvoicePage;