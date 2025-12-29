import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { userService, CreateUserRequest } from "@/services/user.service";
import { UserRole } from "@/types/auth";
import { toast } from "sonner"; // Hoặc dùng hook toast của bạn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const CreateUserPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // State quản lý form
    const [formData, setFormData] = useState<CreateUserRequest>({
        username: "",
        password: "",
        phoneNumber: "",
        fullName: "",
        role: UserRole.STAFF, // Mặc định là STAFF
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value as UserRole });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await userService.createUser(formData);
            toast.success("Tạo người dùng thành công!");
            navigate("/dashboard/admin/users"); // Chuyển hướng về danh sách user sau khi tạo
        } catch (error: any) {
            const msg = error.response?.data?.message || "Lỗi khi tạo người dùng";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
            <h1 className="text-2xl font-bold mb-6 text-center">Tạo Người Dùng Mới</h1>

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Username */}
                <div className="space-y-2">
                    <Label htmlFor="username">Tên đăng nhập</Label>
                    <Input
                        id="username"
                        name="username"
                        placeholder="Nhập tên đăng nhập"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <Label htmlFor="password">Mật khẩu</Label>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        placeholder="Nhập mật khẩu"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Full Name */}
                <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và tên</Label>
                    <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Nhập họ tên đầy đủ"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="phoneNumber"
                        name="phoneNumber"
                        placeholder="+84"
                        value={formData.phoneNumber}
                        onChange={handleChange}
                        required
                    />
                </div>

                {/* Role Selection */}
                <div className="space-y-2">
                    <Label>Phân quyền (Role)</Label>
                    <Select onValueChange={handleRoleChange} defaultValue={formData.role}>
                        <SelectTrigger>
                            <SelectValue placeholder="Chọn quyền hạn" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
                            <SelectItem value={UserRole.MANAGER}>Manager</SelectItem>
                            <SelectItem value={UserRole.STAFF}>Staff</SelectItem>
                            <SelectItem value={UserRole.ACCOUNTANT}>Accountant</SelectItem>
                            <SelectItem value={UserRole.NONE}>None</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => navigate(-1)}
                        className="w-full"
                    >
                        Hủy
                    </Button>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Tạo mới"}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserPage;