import { ProductScanResponse } from "@/types/product";
import api from "./api";


export const productService = {
    getProductByBarcode: async (barcode: string) => {
        const response = await api.get<ProductScanResponse>(`/api/products/barcode/${barcode}`);
        return response.data;
    }
};