// src/services/user.service.ts
import api from "@/services/api"; // Import instance đã cấu hình
import { User, CreateUserRequest, UpdateRoleRequest } from "@/types/user";

// Đường dẫn API gốc cho User (tương đối)
const USER_ENDPOINT = "/api/users";

export const userService = {
    getAllUsers: async () => {
        return api.get<User[]>(USER_ENDPOINT);
    },

    createUser: async (data: CreateUserRequest) => {
        return api.post<User>(USER_ENDPOINT, data);
    },

    updateUserRole: async (id: number, role: string) => {
        const payload: UpdateRoleRequest = { role };
        return api.put<User>(`${USER_ENDPOINT}/${id}`, payload);
    },

    getUserById: async (id: number) => {
        return api.get<User>(`${USER_ENDPOINT}/${id}`);
    }
};