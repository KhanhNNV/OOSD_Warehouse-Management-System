import api from './api'; // Import instance axios có sẵn của ông
import { SupplierInvoiceCreateRequest, SupplierInvoiceResponse } from '../types/supplierInvoice';

const BASE_URL = '/api/supplier-invoices';

export const supplierInvoiceService = {
    // Tạo hóa đơn mới
    create: async (data: SupplierInvoiceCreateRequest) => {
        const response = await api.post<SupplierInvoiceResponse>(`${BASE_URL}/create`, data);
        return response.data;
    },

    // Lấy danh sách hóa đơn nhập
    getAll: async () => {
        const response = await api.get<SupplierInvoiceResponse[]>(BASE_URL);
        return response.data;
    },

    // Lấy chi tiết
    getById: async (id: number) => {
        const response = await api.get<SupplierInvoiceResponse>(`${BASE_URL}/${id}`);
        return response.data;
    }
};