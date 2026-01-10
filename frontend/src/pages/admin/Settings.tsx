import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
// ============ MỚI THÊM ============
import { Loader2, Check, TrendingUp, Calendar } from "lucide-react";
import { useSystemConfig } from "@/hooks/useSystemConfig";
// ==================================

export default function SettingsPage() {
  // ============ MỚI THÊM ============
  const { config, isLoading, isSaving, updateAlgorithm } = useSystemConfig();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }
  // ==================================

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cài đặt"
        description="Quản lý cấu hình hệ thống"
      />

      <div className="space-y-6 max-w-2xl">
        
        {/* ========================================
            MỚI: CẤU HÌNH THUẬT TOÁN XUẤT KHO
        ======================================== */}
        <Card className="border-2 border-blue-100 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Thuật toán xuất kho
            </CardTitle>
            <CardDescription>
              Chọn chiến lược xuất hàng áp dụng cho toàn hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Hiển thị cấu hình hiện tại */}
            {config && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Thuật toán hiện tại</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                      {config.currentAlgorithm}
                    </p>
                  </div>
                  <div className="text-right text-xs text-blue-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(config.updatedAt).toLocaleString("vi-VN")}
                    </div>
                    <div className="text-blue-500 mt-1">
                      Bởi: {config.updatedBy}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Giải thích thuật toán */}
            <div className="space-y-3">
              
              {/* FIFO */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config?.currentAlgorithm === "FIFO" 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => !isSaving && updateAlgorithm("FIFO")}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    config?.currentAlgorithm === "FIFO" 
                      ? "border-blue-600 bg-blue-600" 
                      : "border-slate-300"
                  }`}>
                    {config?.currentAlgorithm === "FIFO" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">FIFO - First In First Out</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      <strong>Xuất hàng nhập trước ra trước</strong> (ưu tiên theo ngày nhập kho)
                    </p>
                    <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc list-inside">
                      <li>Phù hợp: Điện tử, thời trang, thiết bị</li>
                      <li>Tránh hàng cũ tồn kho lâu, giảm lỗi thời</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* FEFO */}
              <div 
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  config?.currentAlgorithm === "FEFO" 
                    ? "border-green-500 bg-green-50" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
                onClick={() => !isSaving && updateAlgorithm("FEFO")}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                    config?.currentAlgorithm === "FEFO" 
                      ? "border-green-600 bg-green-600" 
                      : "border-slate-300"
                  }`}>
                    {config?.currentAlgorithm === "FEFO" && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-800">FEFO - First Expired First Out</h4>
                    <p className="text-sm text-slate-600 mt-1">
                      <strong>Xuất hàng hết hạn trước ra trước</strong> (ưu tiên theo ngày hết hạn)
                    </p>
                    <ul className="text-xs text-slate-500 mt-2 space-y-1 list-disc list-inside">
                      <li>Phù hợp: Thực phẩm, dược phẩm, hóa chất</li>
                      <li>Đảm bảo an toàn, tránh hàng quá hạn</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Button lưu */}
            {isSaving && (
              <div className="flex items-center justify-center p-3 bg-blue-50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                <span className="text-sm text-blue-600 font-medium">Đang cập nhật...</span>
              </div>
            )}
          </CardContent>
        </Card>
        {/* ======== KẾT THÚC PHẦN MỚI ======== */}

        {/* ========================================
            CODE GỐC - GIỮ NGUYÊN 100%
        ======================================== */}
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt chung</CardTitle>
            <CardDescription>
              Cấu hình thông tin cơ bản của hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="warehouse-name">Tên kho hàng</Label>
              <Input id="warehouse-name" defaultValue="Kho trung tâm HCM" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input id="address" defaultValue="123 Nguyễn Văn Linh, Quận 7, TP.HCM" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Thông báo</CardTitle>
            <CardDescription>
              Cấu hình nhận thông báo từ hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Thông báo chênh lệch kiểm kê</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận thông báo khi phát hiện chênh lệch
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Cảnh báo tồn kho thấp</Label>
                <p className="text-sm text-muted-foreground">
                  Thông báo khi sản phẩm sắp hết hàng
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label>Email hàng ngày</Label>
                <p className="text-sm text-muted-foreground">
                  Nhận báo cáo tổng hợp qua email mỗi ngày
                </p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Stocktake Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt Kiểm kê</CardTitle>
            <CardDescription>
              Cấu hình quy trình kiểm kê hàng hóa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="variance-threshold">Ngưỡng chênh lệch cảnh báo (%)</Label>
              <Input id="variance-threshold" type="number" defaultValue="5" />
              <p className="text-sm text-muted-foreground">
                Hệ thống sẽ cảnh báo khi chênh lệch vượt ngưỡng này
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Yêu cầu duyệt điều chỉnh</Label>
                <p className="text-sm text-muted-foreground">
                  Mọi điều chỉnh tồn kho cần được quản lý duyệt
                </p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button>Lưu cài đặt</Button>
        </div>
      </div>
    </div>
  );
}