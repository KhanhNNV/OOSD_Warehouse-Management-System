import api from "@/services/api.ts";
import {Supplier,PurchaseOrder} from "@/types/purchase-order.ts";

const ENDPOINT="/api/purchase-order";
const SUPPLIERS_ENDPOINT = "/api/suppliers";


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


    uploadPoFromExcel: async (file: File, supplierId: number): Promise<PurchaseOrder> => {
        const formData = new FormData();
        // Key 'file' và 'supplierId' phải khớp với @RequestParam bên Spring Boot
        formData.append("file", file);
        formData.append("supplierId", String(supplierId));

        const response = await api.post<PurchaseOrder>(
            `${ENDPOINT}/upload-excel`,
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            }
        );
        return response.data;
    },

    cancelPurchaseOrder: async (id: number | string): Promise<PurchaseOrder> => {
        const response = await api.put(`/api/purchase-order/${id}/cancel`);
        return response.data;
    },
};