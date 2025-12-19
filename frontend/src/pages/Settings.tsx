import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Cài đặt"
        description="Quản lý cấu hình hệ thống"
      />

      <div className="space-y-6 max-w-2xl">
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
