// src/services/user.service.ts
import api from "@/services/api";
import { UserRole } from "@/types/auth";

export interface CreateUserRequest {
    username: string;
    password: string; // Password thường cần khi tạo mới
    fullName: string;
    phoneNumber: string,
    role: UserRole;
}

export const userService = {
    createUser: async (data: CreateUserRequest) => {
        // Lưu ý: Đường dẫn '/createUser' phụ thuộc vào @RequestMapping ở Controller của bạn
        // Nếu Controller có @RequestMapping("/users") thì phải là "/users/createUser"
        const response = await api.post("/createUser", data);
        return response.data;
    }
};