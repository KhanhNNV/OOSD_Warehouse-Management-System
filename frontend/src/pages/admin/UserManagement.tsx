import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Edit, Lock,X } from "lucide-react";
import { cn } from "@/lib/utils";

// UI Components (Shadcn)
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { useUserManagement } from "@/hooks/useUserManagement";
import { User, CreateUserRequest, UserRole } from "@/types/user";

import { usePagination } from "@/hooks/usePagination";
import { PaginationControls } from "@/components/common/PaginationControls";

// Config màu sắc cho UI (có thể tách ra constants file nếu muốn)
const roleConfig: Record<string, { label: string; color: string }> = {
    ADMIN: { label: "Quản trị viên", color: "bg-red-100 text-red-800" },
    MANAGER: { label: "Quản lý kho", color: "bg-blue-100 text-blue-800" },
    STAFF: { label: "Nhân viên", color: "bg-green-100 text-green-800" },
    ACCOUNTANT: { label: "Kế toán", color: "bg-yellow-100 text-yellow-800" },
};

const UserManagementPage = () => {
    // 1. Sử dụng Custom Hook
    const {
        filteredUsers, loading, searchTerm, setSearchTerm,
        createUser, updateUserRole,roleFilter, setRoleFilter
    } = useUserManagement();

    const {
        currentData, // Dùng biến này để map vào bảng thay vì filteredUsers
        currentPage,
        totalPages,
        goToPage,
        totalItems
    } = usePagination(filteredUsers, 5);

    // 2. Local State cho UI (Dialogs & Form Inputs)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form State
    const [newUser, setNewUser] = useState<CreateUserRequest>({
        username: "", password: "", fullName: "", phoneNumber: "", role: UserRole.STAFF
    });

    // 3. Handlers cho UI
    const handleCreateSubmit = async () => {
        if (!newUser.username || !newUser.password || !newUser.fullName) return;

        const success = await createUser(newUser);
        if (success) {
            setIsCreateDialogOpen(false);
            setNewUser({ username: "", password: "", fullName: "", phoneNumber: "", role: UserRole.STAFF });
        }
    };

    const handleUpdateRoleSubmit = async () => {
        if (!editingUser) return;
        const success = await updateUserRole(editingUser.id, editingUser.role as string);
        if (success) setEditingUser(null);
    };

    const clearFilters = () => {
        setSearchTerm("");
        setRoleFilter("ALL");
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Người dùng</h1>
                    <p className="text-muted-foreground">Tạo và phân quyền tài khoản</p>
                </div>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Tạo tài khoản
                </Button>
            </div>

            {/* --- FILTERS --- */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="w-full md:w-[200px]">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger>
                            <div className="flex items-center gap-2">
                                <Filter className="w-4 h-4 text-muted-foreground" />
                                <SelectValue placeholder="Chọn vai trò" />
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tất cả vai trò</SelectItem>
                            {Object.keys(roleConfig).map((r) => (
                                <SelectItem key={r} value={r}>
                                    {roleConfig[r].label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* 3. Nút Reset (Chỉ hiện khi đang lọc hoặc tìm kiếm) */}
                {(searchTerm || roleFilter !== "ALL") && (
                    <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground">
                        <X className="w-4 h-4 mr-2" /> Xóa bộ lọc
                    </Button>
                )}
            </div>

            {/* --- TABLE --- */}
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Họ và tên</TableHead>
                            <TableHead>Username</TableHead>
                            <TableHead>Số điện thoại</TableHead>
                            <TableHead>Vai trò</TableHead>
                            <TableHead className="w-[80px]">Thao tác</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={5} className="text-center py-8">Đang tải...</TableCell></TableRow>
                        ) : currentData.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell className="font-medium">{user.fullName}</TableCell>
                                <TableCell className="text-muted-foreground font-mono">{user.username}</TableCell>
                                <TableCell>{user.phoneNumber || "---"}</TableCell>
                                <TableCell>
                                    <Badge variant="secondary" className={cn("font-normal", roleConfig[user.role as string]?.color)}>
                                        {roleConfig[user.role as string]?.label || user.role}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => setEditingUser(user)}>
                                                <Edit className="w-4 h-4 mr-2" /> Phân quyền
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {/* --- PHÂN TRANG --- */}
                {!loading && filteredUsers.length > 0 && (
                    <div className="border-t">
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={goToPage}
                            totalItems={totalItems}
                        />
                    </div>
                )}
            </div>

            {/* --- CREATE DIALOG --- */}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Tạo tài khoản mới</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Username</Label>
                                <Input value={newUser.username} onChange={(e) => setNewUser({...newUser, username: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>Vai trò</Label>
                                <Select value={newUser.role as string} onValueChange={(v) => setNewUser({...newUser, role: v})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.keys(roleConfig).map((r) => <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Mật khẩu</Label>
                            <Input type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Họ tên</Label>
                                <Input value={newUser.fullName} onChange={(e) => setNewUser({...newUser, fullName: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label>SĐT</Label>
                                <Input value={newUser.phoneNumber} onChange={(e) => setNewUser({...newUser, phoneNumber: e.target.value})} />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleCreateSubmit}>Tạo mới</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* --- EDIT ROLE DIALOG --- */}
            <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
                <DialogContent>
                    <DialogHeader><DialogTitle>Cập nhật vai trò</DialogTitle></DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Tài khoản</Label>
                            <Input value={editingUser?.username} disabled className="bg-muted" />
                        </div>
                        <div className="space-y-2">
                            <Label>Vai trò mới</Label>
                            <Select
                                value={editingUser?.role as string}
                                onValueChange={(val) => setEditingUser(prev => prev ? { ...prev, role: val } : null)}
                            >
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.keys(roleConfig).map((r) => <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpdateRoleSubmit}>Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default UserManagementPage;