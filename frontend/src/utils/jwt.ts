// src/utils/jwt.ts
import { User, UserRole } from "@/types/auth";

export const parseJwt = (token: string): User | null => {
    try {
        if (!token) return null;

        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            window
                .atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join("")
        );

        const payload = JSON.parse(jsonPayload);

        let rawRole =
            payload.role ||
            payload.roles ||
            payload.scope || // <--- Backend của bạn dùng field này
            (Array.isArray(payload.authorities) ? payload.authorities[0] : null) ||
            "NONE";

        // Xử lý nếu scope là một chuỗi chứa nhiều quyền cách nhau bằng dấu cách (VD: "read write ADMIN")
        // Tuy nhiên theo log bạn gửi thì nó chỉ là "ADMIN", nên code dưới đây vẫn chạy tốt.
        if (typeof rawRole === 'string' && rawRole.includes(' ')) {
            // Logic phụ: nếu scope là "read write ADMIN", ta cần tách lấy cái nào khớp với Role
            const scopes = rawRole.split(' ');
            // Tìm xem trong đống scope có cái nào khớp với Enum UserRole không
            const found = scopes.find(s => Object.values(UserRole).includes(s as UserRole));
            if (found) rawRole = found;
        }

        // Chuẩn hóa về chữ hoa
        if (Array.isArray(rawRole)) {
            rawRole = rawRole[0];
        }
        rawRole = String(rawRole).toUpperCase();

        // Cắt bỏ "ROLE_" nếu có
        if (rawRole.startsWith("ROLE_")) {
            rawRole = rawRole.substring(5);
        }

        // Map sang Enum
        const userRole: UserRole = Object.values(UserRole).includes(rawRole as UserRole)
            ? (rawRole as UserRole)
            : UserRole.NONE;

        return {
            // Lưu ý: Payload 'sub' của bạn là "admin" (chữ), nên ép kiểu Number sẽ ra NaN.
            // Tạm thời để id = 0 hoặc random nếu backend không trả về ID số.
            id: !isNaN(Number(payload.sub)) ? Number(payload.sub) : 0,
            username: payload.sub || "", // Dùng sub làm username
            fullName: payload.fullName || payload.name || payload.sub || "",
            phoneNumber: payload.phoneNumber,
            role: userRole,
            exp: payload.exp,
        };
    } catch (error) {
        console.error("Lỗi parse JWT:", error);
        return null;
    }
};