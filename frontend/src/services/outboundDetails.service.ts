    import { OutboundDetail } from "@/types/outboundDetails";
    import api from "./api";

    export const outboundService = {
        // API lấy danh sách chi tiết đơn hàng
        getOrderDetails: async (orderId: number) => {
            const response = await api.get<OutboundDetail[]>(`/outbound-orders/${orderId}/details`);
            return response.data;
        }
    };