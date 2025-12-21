import { useState } from "react";
import { Plus, Search, Filter, Edit, Lock, Unlock, MoreHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, UserRole } from "@/types/wms";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const mockUsers: User[] = [
  {
    id: "1",
    username: "admin01",
    email: "admin@wms.com",
    fullName: "Nguyễn Văn Admin",
    role: "admin",
    status: "active",
    createdAt: "2024-01-01T08:00:00Z",
    lastLogin: "2024-10-14T09:00:00Z",
    phone: "0901234567",
  },
  {
    id: "2",
    username: "manager01",
    email: "manager@wms.com",
    fullName: "Trần Thị Manager",
    role: "manager",
    status: "active",
    createdAt: "2024-02-15T08:00:00Z",
    lastLogin: "2024-10-14T08:30:00Z",
    phone: "0912345678",
  },
  {
    id: "3",
    username: "staff01",
    email: "staff01@wms.com",
    fullName: "Lê Văn Staff",
    role: "staff",
    status: "active",
    createdAt: "2024-03-10T08:00:00Z",
    lastLogin: "2024-10-13T17:00:00Z",
    phone: "0923456789",
  },
  {
    id: "4",
    username: "staff02",
    email: "staff02@wms.com",
    fullName: "Phạm Thị Nhân Viên",
    role: "staff",
    status: "locked",
    createdAt: "2024-04-05T08:00:00Z",
    phone: "0934567890",
  },
  {
    id: "5",
    username: "accountant01",
    email: "accountant@wms.com",
    fullName: "Hoàng Văn Kế Toán",
    role: "accountant",
    status: "active",
    createdAt: "2024-05-20T08:00:00Z",
    lastLogin: "2024-10-14T07:45:00Z",
    phone: "0945678901",
  },
];

const roleLabels: Record<UserRole, string> = {
  admin: "Quản trị viên",
  manager: "Quản lý kho",
  staff: "Nhân viên kho",
  accountant: "Kế toán",
};

const roleColors: Record<UserRole, string> = {
  admin: "bg-destructive/10 text-destructive",
  manager: "bg-primary/10 text-primary",
  staff: "bg-info/10 text-info",
  accountant: "bg-success/10 text-success",
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    username: "",
    email: "",
    fullName: "",
    phone: "",
    role: "staff" as UserRole,
  });

  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleCreateUser = () => {
    const user: User = {
      id: String(users.length + 1),
      ...newUser,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    setUsers([user, ...users]);
    setIsCreateDialogOpen(false);
    setNewUser({
      username: "",
      email: "",
      fullName: "",
      phone: "",
      role: "staff",
    });
    toast({
      title: "Tạo tài khoản thành công",
      description: `Đã tạo tài khoản cho ${user.fullName}`,
    });
  };

  const handleToggleLock = (user: User) => {
    const updatedUsers = users.map((u) =>
      u.id === user.id
        ? { ...u, status: u.status === "active" ? "locked" : "active" }
        : u
    ) as User[];
    setUsers(updatedUsers);
    toast({
      title: user.status === "active" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      description: `Tài khoản ${user.fullName} đã được ${user.status === "active" ? "khóa" : "mở khóa"}`,
    });
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Quản lý Người dùng"
        description="Tạo và phân quyền tài khoản cho nhân viên"
        action={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Tạo tài khoản
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Object.entries(roleLabels).map(([role, label]) => (
          <div key={role} className="bg-card rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold mt-1">
              {users.filter((u) => u.role === role).length}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email, username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          Bộ lọc
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              <TableHead className="font-semibold">Họ tên</TableHead>
              <TableHead className="font-semibold">Username</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Vai trò</TableHead>
              <TableHead className="font-semibold">Trạng thái</TableHead>
              <TableHead className="font-semibold">Đăng nhập cuối</TableHead>
              <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.id}
                className={cn(
                  "hover:bg-table-row-hover transition-colors",
                  user.status === "locked" && "opacity-60"
                )}
              >
                <TableCell className="font-medium">{user.fullName}</TableCell>
                <TableCell className="font-mono text-sm">{user.username}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={roleColors[user.role]}>
                    {roleLabels[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      user.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-destructive/10 text-destructive"
                    }
                  >
                    {user.status === "active" ? "Hoạt động" : "Đã khóa"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {user.lastLogin ? formatDate(user.lastLogin) : "Chưa đăng nhập"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => setEditingUser(user)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleLock(user)}>
                        {user.status === "active" ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4 mr-2" />
                            Mở khóa
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo tài khoản mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin để tạo tài khoản cho nhân viên mới.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Họ và tên</Label>
              <Input
                id="fullName"
                value={newUser.fullName}
                onChange={(e) =>
                  setNewUser({ ...newUser, fullName: e.target.value })
                }
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  placeholder="nguyenvana"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser({ ...newUser, phone: e.target.value })
                  }
                  placeholder="0901234567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUser.email}
                onChange={(e) =>
                  setNewUser({ ...newUser, email: e.target.value })
                }
                placeholder="email@company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Vai trò</Label>
              <Select
                value={newUser.role}
                onValueChange={(value: UserRole) =>
                  setNewUser({ ...newUser, role: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="manager">Quản lý kho</SelectItem>
                  <SelectItem value="staff">Nhân viên kho</SelectItem>
                  <SelectItem value="accountant">Kế toán</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreateUser}>Tạo tài khoản</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa tài khoản</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin và phân quyền cho tài khoản.
            </DialogDescription>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Họ và tên</Label>
                <Input
                  id="edit-fullName"
                  defaultValue={editingUser.fullName}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Username</Label>
                  <Input
                    id="edit-username"
                    defaultValue={editingUser.username}
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Số điện thoại</Label>
                  <Input
                    id="edit-phone"
                    defaultValue={editingUser.phone}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  defaultValue={editingUser.email}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Vai trò</Label>
                <Select defaultValue={editingUser.role}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="admin">Quản trị viên</SelectItem>
                    <SelectItem value="manager">Quản lý kho</SelectItem>
                    <SelectItem value="staff">Nhân viên kho</SelectItem>
                    <SelectItem value="accountant">Kế toán</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Hủy
            </Button>
            <Button
              onClick={() => {
                toast({
                  title: "Cập nhật thành công",
                  description: "Thông tin tài khoản đã được cập nhật",
                });
                setEditingUser(null);
              }}
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
