import { LogOut, RefreshCw, Menu, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { authUtils } from "@/utils/auth";

interface AppHeaderProps {
  onMenuClick?: () => void;
}

export function AppHeader({ onMenuClick }: AppHeaderProps) {
  const { logout, user, switchAccount } = useAuth();
  const isMobile = useIsMobile();

  const getUserInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Section - Mobile Menu Button */}
      <div className="flex items-center gap-3">
        {isMobile && onMenuClick && (
          <Button variant="ghost" size="icon" onClick={onMenuClick}>
            <Menu className="w-5 h-5" />
          </Button>
        )}

        {/* Optional: Add logo or title here */}
        {/* <h1 className="text-lg font-semibold hidden md:block">WMS System</h1> */}
      </div>

      {/* Right Section - User Menu */}
      <div className="flex items-center ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-auto py-2"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getUserInitials(user?.fullName || user?.username)}
                </AvatarFallback>
              </Avatar>

              {/* ✅ Show on both mobile and desktop */}
              <div className="text-left">
                <p className="text-sm font-medium leading-tight">
                  {user?.username || "Người dùng"}
                </p>
                <p className="text-xs text-muted-foreground leading-tight">
                  {user?.role ? authUtils.getRoleLabel(user.role) : ""}
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.username || "Người dùng"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.fullName || user?.username || ""}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem className="cursor-pointer">
              <User className="w-4 h-4 mr-2" />
              Hồ sơ
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {/* Switch Account */}
            <DropdownMenuItem
              onClick={switchAccount}
              className="cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Đổi tài khoản
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={logout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Đăng xuất
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
