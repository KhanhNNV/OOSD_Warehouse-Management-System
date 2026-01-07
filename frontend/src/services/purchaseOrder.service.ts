import {PurchaseOrder} from "@/types/inbound.ts";
import api from "@/services/api.ts";

const ENDPOINT="/api/purchase-order";
const SUPPLIERS_ENDPOINT = "/suppliers";

export interface Supplier {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
}
export const purchaseOrderService = {
    getPOs: async (): Promise<PurchaseOrder[]> => {
        try {
            // Gọi GET /purchase-orders
            // api.get sẽ tự động kẹp Token vào header nhờ interceptor
            const response = await api.get<PurchaseOrder[]>(ENDPOINT);

            // Trả về dữ liệu từ backend
            return response.data;
        } catch (error) {
            console.error("Lỗi khi lấy danh sách PO:", error);
            throw error; // Ném lỗi ra để Component xử lý (hiện thông báo)
        }
    },

    // 1.5. Lấy danh sách Nhà cung cấp
    getSuppliers: async (): Promise<Supplier[]> => {
        const res = await api.get<any>(SUPPLIERS_ENDPOINT);

        // Backend hiện tại: List<SupplierResponse>
        if (Array.isArray(res.data)) return res.data;

        // Phòng thủ (nếu sau này bọc ApiResponse)
        if (Array.isArray(res.data?.data)) return res.data.data;

        // Không đúng format → trả mảng rỗng (UI không crash)
        return [];
    },

    // 2. Lấy chi tiết một phiếu nhập (Ví dụ bổ sung)
    getPODetail: async (id: string): Promise<PurchaseOrder> => {
        const response = await api.get<PurchaseOrder>(`${ENDPOINT}/details/${id}`);
        return response.data;
    },

    // 3. Tạo phiếu nhập mới (Ví dụ bổ sung)
    createPO: async (data): Promise<PurchaseOrder> => {
        const response = await api.post<PurchaseOrder>(ENDPOINT, data);
        return response.data;
    },
};