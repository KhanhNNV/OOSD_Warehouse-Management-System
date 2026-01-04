export enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    STAFF = "STAFF",
    ACCOUNTANT = "ACCOUNTANT",
}

// Tương ứng với UserCreateRespone từ Java
export interface User {
    id: number;
    username: string;
    fullName: string;
    phoneNumber: string | null;
    role: UserRole | string;
}

// Tương ứng với UserCreateRequest
export interface CreateUserRequest {
    username: string;
    password?: string;
    fullName: string;
    phoneNumber: string;
    role: UserRole | string;
}

// Payload khi update role
export interface UpdateRoleRequest {
    role: string;
}