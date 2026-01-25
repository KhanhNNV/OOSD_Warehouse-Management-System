import * as React from "react";
import { toast } from "@/components/ui/use-toast"; // Đảm bảo đường dẫn đúng

// Type khớp với Java Backend
interface ApiErrorResponse {
    status: number | string;
    message: string;
    details?: string | Record<string, string> | string[] | null;
}

export function toastError(error: any) {
    // 1. Lấy data an toàn
    const data: ApiErrorResponse = error?.response?.data || {
        message: "Lỗi kết nối hoặc lỗi không xác định",
        status: 500,
        details: null
    };

    const title = data.message;

    let description: React.ReactNode = null;

    // 2. Kiểm tra từng loại kiểu dữ liệu của details
    if (Array.isArray(data.details)) {
        // Trường hợp: List<String>
        description = (
            <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                {data.details.map((item, idx) => (
                    <li key={idx}>{String(item)}</li>
                ))}
            </ul>
        );
    } else if (typeof data.details === "object" && data.details !== null) {
        // Trường hợp: Map<String, String> (Object)
        description = (
            <ul className="list-disc pl-4 mt-1 space-y-1 text-sm">
                {Object.entries(data.details).map(([key, value]) => (
                    <li key={key}>
                        <span className="font-semibold">{key}: </span>
                        {String(value)}
                    </li>
                ))}
            </ul>
        );
    } else if (typeof data.details === "string") {
        // Trường hợp: String
        description = data.details;
    } else {
        // Trường hợp: null hoặc undefined -> Hiển thị Status code cho đỡ trống
        description = `Mã lỗi hệ thống: ${data.status || "Unknown"}`;
    }

    // 3. Gọi Toast
    toast({
        variant: "destructive",
        title: title,
        description: description,
    });
}