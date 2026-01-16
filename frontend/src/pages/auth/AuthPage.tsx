import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { authUtils } from "@/utils/auth"; //
import { LogOut, ArrowRight, Warehouse } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, isLoading, error: authError, switchAccount } = useAuth();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState("");

  // Check if user already logged in
  useEffect(() => {
    const user = authUtils.getCurrentUser(); // Sử dụng authUtils

    if (user) {
      setCurrentUser(user);
      // Nếu role là NONE, vẫn show info nhưng không có button Continue
    } else {
      setShowLoginForm(true);
    }
  }, []);

  // Handle continue with current account
  const handleContinue = () => {
    if (currentUser && currentUser.role !== "NONE") {
      const redirectPath = authUtils.getRoleHomePath(currentUser.role);
      navigate(redirectPath);
    }
  };

  // Handle logout (switch account)
  const handleSwitchAccount = () => {
    switchAccount();
    setCurrentUser(null);
    setShowLoginForm(true);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError("");

    if (!username.trim() || !password.trim()) {
      setLocalError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    await login({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-3 text-center">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Warehouse className="w-9 h-9 text-white" />
            </div>
          </div>

          <div>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              WMS - Hệ thống quản lý kho
            </CardTitle>
            <CardDescription className="text-base mt-2">
              {showLoginForm ? "Đăng nhập để tiếp tục" : "Chào mừng trở lại"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Show current user info if logged in */}
          {currentUser && !showLoginForm && (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="space-y-3">
                  <p className="font-medium text-gray-900">
                    Bạn đã đăng nhập với tài khoản:
                  </p>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-lg">
                          {currentUser.fullName?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-sm text-gray-600 truncate">
                          {currentUser.email || currentUser.username}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {authUtils.getRoleLabel(currentUser.role)}{" "}
                            {/* ✅ */}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {/* Action buttons */}
              <div className="space-y-3">
                {/* Show Continue only if role is not NONE */}
                {currentUser.role !== "NONE" && (
                  <Button
                    className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                    onClick={handleContinue}
                  >
                    Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}

                {/* Show message if NONE */}
                {currentUser.role === "NONE" && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertDescription>
                      Tài khoản của bạn đang chờ phê duyệt. Vui lòng đăng nhập
                      tài khoản khác hoặc liên hệ quản trị viên.
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  variant="outline"
                  className="w-full h-11 border-2 hover:bg-gray-50 transition-colors"
                  onClick={handleSwitchAccount}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Đăng xuất và đăng nhập tài khoản khác
                </Button>
              </div>
            </div>
          )}

          {/* Login Form */}
          {showLoginForm && (
            <form onSubmit={handleLogin} className="space-y-4">
              {(authError || localError) && (
                <Alert variant="destructive">
                  <AlertDescription>{authError || localError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Tên đăng nhập
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Nhập tên đăng nhập"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang đăng nhập...
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/register")}
                  className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                >
                  Đăng ký ngay
                </button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
