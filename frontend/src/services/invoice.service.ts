// src/services/invoice.service.ts
import api from './api'; // Import instance axios từ file api.ts có sẵn của bạn
import { Invoice, InvoiceCreateRequest } from '../types/invoice';
import { OutboundOrder } from '../types/outboundForStaff.ts'; // Giả sử bạn đã có type này, nếu chưa thì dùng any tạm

export const invoiceService = {
    // 1. Lấy danh sách đơn hàng để lọc ra đơn PACKED
    // Lưu ý: Nếu backend chưa có API lọc, ta lấy hết rồi lọc ở Frontend
    getPackedOrders: async () => {
        const response = await api.get<OutboundOrder[]>('/api/outbound-orders');
        // Lọc client-side chỉ lấy đơn PACKED
        return response.data.filter((order: any) => order.status === 'PACKED');
    },

    // 2. Gọi API tạo hóa đơn
    createInvoice: async (data: InvoiceCreateRequest) => {
        const response = await api.post<Invoice>('/api/invoices/create', data);
        return response.data;
    }
};