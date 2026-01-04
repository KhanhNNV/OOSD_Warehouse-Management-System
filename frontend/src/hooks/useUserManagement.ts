import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { userService } from "@/services/user.service";
import { User, CreateUserRequest } from "@/types/user";


export const useUserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<string>("ALL");


    // Hàm load dữ liệu
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await userService.getAllUsers();
            setUsers(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải danh sách người dùng");
        } finally {
            setLoading(false);
        }
    };

    // Tự động load khi mount
    useEffect(() => {
        fetchUsers();
    }, []);

    // Logic tạo user
    const createUser = async (data: CreateUserRequest) => {
        try {
            await userService.createUser(data);
            toast.success("Tạo tài khoản thành công");
            fetchUsers(); // Refresh lại list
            return true; // Trả về true nếu thành công
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi khi tạo tài khoản";
            toast.error(msg);
            return false;
        }
    };

    // Logic update role
    const updateUserRole = async (id: number, newRole: string) => {
        try {
            await userService.updateUserRole(id, newRole);
            toast.success("Cập nhật vai trò thành công");
            fetchUsers();
            return true;
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi cập nhật vai trò";
            toast.error(msg);
            return false;
        }
    };

    // Logic Filter (Client-side)
    // Dùng useMemo để tránh tính toán lại không cần thiết khi component re-render
    const filteredUsers = useMemo(() => {
        const lowerTerm = searchTerm.toLowerCase();
        return users.filter(
            (u) =>{
                const lowerTerm = searchTerm.toLowerCase();
                const matchesSearch =
                    u.fullName?.toLowerCase().includes(lowerTerm) ||
                    u.username?.toLowerCase().includes(lowerTerm);
                const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

                return matchesSearch && matchesRole;
            }

        );
    }, [users, searchTerm,roleFilter]);

    return {
        users,
        filteredUsers,
        loading,
        searchTerm,
        setSearchTerm,
        refreshUsers: fetchUsers,
        createUser,
        updateUserRole,
        roleFilter,
        setRoleFilter,
    };
};