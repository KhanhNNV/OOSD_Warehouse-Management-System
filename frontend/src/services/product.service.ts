import api from "./api";

// Định nghĩa kiểu dữ liệu trả về từ Backend (ProductScanResponse)
export interface ProductScanResponse {
    productId: string;    
    sku: string;
    productName: string;    
    imageProduct: string;   
    barcode: string;
    unit: string;           
    
}

export const productService = {
    // Gọi API: GET /api/products/barcode/{barcode}
    // LƯU Ý: Phải khớp chính xác với @GetMapping("/barcode/{barcode}") của bạn
    getProductByBarcode: async (barcode: string) => {
        const response = await api.get<ProductScanResponse>(`/api/products/barcode/${barcode}`);
        return response.data;
    }
};