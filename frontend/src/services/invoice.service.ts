// src/services/invoice.service.ts
import api from './api'; // Axios instance
import { Invoice, InvoiceCreateRequest } from '../types/invoice';
// import { OutboundOrder } from '../types/outbound';

export const invoiceService = {
    // 1. Lấy danh sách đơn hàng để lọc ra đơn PACKED
    getPackedOrders: async () => {
        // Gọi API
        const response = await api.get('/api/outbound/orders');

        // 🛠️ FIX LỖI: Xử lý ApiResponse từ Backend
        // Backend trả về: { status: "success", data: [...danh sách...], message: "..." }
        const apiResponse = response.data;

        // Lấy mảng thực sự (nếu có .data thì lấy .data, nếu không thì lấy chính nó)
        // Trường hợp phân trang thì lấy .data.content (tùy backend), nhưng ở đây tạm check .data trước
        const orders = Array.isArray(apiResponse.data) ? apiResponse.data : (apiResponse || []);

        // Đảm bảo nó là mảng trước khi filter
        if (Array.isArray(orders)) {
            // Lọc client-side chỉ lấy đơn PACKED (hoặc trạng thái bạn cần)
            return orders.filter((order: any) => order.status === 'PACKED' || order.status === 'ALLOCATED');
        }

        return [];
    },

    // 2. Gọi API tạo hóa đơn
    createInvoice: async (data: InvoiceCreateRequest) => {
        const response = await api.post('/api/invoices/create', data); // API backend mình thấy là /api/invoices (chuẩn REST), bạn check lại nếu là /create
        // Trả về data bên trong wrapper
        return response.data.data || response.data;
    },

    // 3. LẤY LỊCH SỬ HÓA ĐƠN (SỬA ĐOẠN NÀY)
    getAllInvoices: async () => {
        const response = await api.get('/api/invoices');
        const rawData = response.data;

        // LOGIC TỰ DÒ TÌM DỮ LIỆU:

        // Trường hợp 1: API trả về { data: [...] } (ApiResponse chuẩn)
        if (rawData.data && Array.isArray(rawData.data)) {
            return rawData.data;
        }

        // Trường hợp 2: API trả về { data: { content: [...] } } (Phân trang Page<>)
        if (rawData.data?.content && Array.isArray(rawData.data.content)) {
            return rawData.data.content;
        }

        // Trường hợp 3: API trả về [...] (List trần - Code cũ)
        if (Array.isArray(rawData)) {
            return rawData;
        }

        // Không tìm thấy gì thì trả về rỗng để không lỗi web
        return [];
    },

    // 4. Lấy chi tiết hóa đơn
    getInvoiceById: async (id: number) => {
        const response = await api.get(`/api/invoices/${id}`);
        return response.data.data || response.data;
    }
};