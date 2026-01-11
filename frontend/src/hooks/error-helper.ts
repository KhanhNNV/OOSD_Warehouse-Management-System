import { toast } from "@/hooks/use-toast"; // Import toast từ file bạn cung cấp

export const handleErrorApi = (error: any, defaultTitle: string = "Đã có lỗi xảy ra") => {
    let description = "Vui lòng thử lại sau hoặc liên hệ quản trị viên.";

    // Kiểm tra xem có response từ Backend trả về không
    if (error.response && error.response.data) {
        const data = error.response.data;

        // Trường hợp 1: Backend trả về object có key 'message' (Thường gặp nhất trong Spring Boot)
        // Ví dụ: { "timestamp":..., "status": 409, "error": "Conflict", "message": "Đơn hàng đang có phiếu nháp..." }
        if (data.details) {
            description = data.details;
        }
        // Sau đó mới check đến message chung
        else if (data.message) {
            description = data.message;
        }
        // Trường hợp 2: Backend trả về object có key 'error' là text
        else if (data.error && typeof data.error === 'string') {
            description = data.error;
        }
        // Trường hợp 3: Backend trả về chuỗi trực tiếp (Raw String)
        else if (typeof data === 'string') {
            description = data;
        }
            // Trường hợp 4: Backend trả về list lỗi (Validation) - Lấy lỗi đầu tiên
        // Ví dụ: { "fieldErrors": { "email": "Email không hợp lệ" } }
        else if (data.fieldErrors) {
            const firstKey = Object.keys(data.fieldErrors)[0];
            description = data.fieldErrors[firstKey];
        }
    }
    // Trường hợp 5: Lỗi mạng (Network Error) hoặc không có response
    else if (error.message) {
        description = error.message;
    }

    // Gọi hàm toast để hiển thị
    toast({
        title: defaultTitle,
        description: description,
        variant: "destructive", // Màu đỏ cảnh báo (theo quy chuẩn shadcn/ui)
        duration: 5000, // Hiện trong 5 giây
    });
};