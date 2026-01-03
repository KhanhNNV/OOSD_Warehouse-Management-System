// src/services/user.service.ts
import api from "@/services/api";
import { UserRole } from "@/types/auth";

export interface CreateUserRequest {
    username: string;
    password: string;
    fullName: string;
    phoneNumber: string,
    role: UserRole;
}

export const userService = {
    createUser: async (data: CreateUserRequest) => {
        const response = await api.post("/api/users", data);
        return response.data;
    }
};