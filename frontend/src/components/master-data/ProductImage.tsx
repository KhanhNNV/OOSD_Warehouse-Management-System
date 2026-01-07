import { useState } from "react";
import { ImageIcon } from "lucide-react";

// Component xử lý ảnh an toàn
export const ProductImage = ({ src, alt }: { src: string | undefined; alt: string }) => {
    const [isError, setIsError] = useState(false);

    // Hàm xử lý URL (đưa logic từ bên ngoài vào đây cho gọn)
    const getSafeImageUrl = (url: string | undefined): string => {
        if (!url) return "";
        if (url.startsWith("http")) return url;
        // Xử lý đường dẫn local nếu cần
        if (url.includes("api/uploads")) {
            return `http://localhost:8080${url.startsWith("/") ? "" : "/"}${url}`;
        }
        return `http://localhost:8080/api/uploads/${url}`;
    };

    // 1. Nếu không có src HOẶC đã bị lỗi trước đó -> Render Icon ngay lập tức
    // (Không render thẻ img -> Không có request nào được gửi đi -> Hết loop)
    if (!src || isError) {
        return (
            <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-400 border shrink-0">
                <ImageIcon size={20} />
            </div>
        );
    }

    // 2. Render thẻ img bình thường
    return (
        <img
            src={getSafeImageUrl(src)}
            alt={alt}
            className="w-10 h-10 rounded object-cover border shrink-0"
            onError={(e) => {
                // Chặn loop tại đây:
                // Ngăn trình duyệt thử tải lại ảnh
                e.currentTarget.onerror = null;
                // Set state để lần render sau sẽ nhảy vào nhánh if ở trên (hiện Icon)
                setIsError(true);
            }}
        />
    );
};