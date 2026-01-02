// src/types/auth.ts

export enum UserRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    STAFF = "STAFF",
    ACCOUNTANT = "ACCOUNTANT",
    NONE = "NONE",
}

export interface User {
    id: number;
    username: string;
    fullName: string;
    phoneNumber: string;
    role: UserRole;
    exp?: number;
}

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegisterData {
    username: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface RefreshTokenResponse{
    accessToken: string;
    refreshToken: string;
}