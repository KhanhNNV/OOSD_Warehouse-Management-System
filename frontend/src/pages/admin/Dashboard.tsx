import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Database,
  Warehouse,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalLocations: 0,
    totalCategories: 0,
    activeUsers: 0,
    systemHealth: "Good",
  });

  useEffect(() => {
    loadAdminStats();
  }, []);

  const loadAdminStats = async () => {
    try {
      const [users, products, categories] = await Promise.all([
        api.get("/api/users").catch(() => ({ data: [] })),
        api.get("/api/products").catch(() => ({ data: [] })),
        api.get("/api/categories").catch(() => ({ data: [] })),
      ]);

      setStats({
        totalUsers: users.data.length || 0,
        totalProducts: products.data.length || 0,
        totalLocations: 0, // Implement if API exists
        totalCategories: categories.data.length || 0,
        activeUsers: users.data.filter((u: any) => u.status === "active")
          .length,
        systemHealth: "Good",
      });
    } catch (error) {
      console.error("Error loading admin stats:", error);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Quản trị hệ thống"
        description="Giám sát và quản lý toàn bộ WMS"
      />

      {/* SYSTEM METRICS */}
      <div className="grid gap-4 md:grid-cols-4">
        <SystemCard
          title="Người dùng"
          value={stats.totalUsers}
          subtitle={`${stats.activeUsers} đang hoạt động`}
          icon={Users}
          onClick={() => navigate("/admin/users")}
        />
        <SystemCard
          title="Sản phẩm"
          value={stats.totalProducts}
          icon={Database}
          variant="success"
          onClick={() => navigate("/admin/master-data")}
        />
        <SystemCard
          title="Danh mục"
          value={stats.totalCategories}
          icon={Warehouse}
          onClick={() => navigate("/admin/master-data")}
        />
        <SystemCard
          title="Hệ thống"
          value={stats.systemHealth}
          icon={Activity}
          variant="success"
        />
      </div>

      {/* QUICK ACTIONS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quản lý nhanh</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <AdminAction
              label="Quản lý người dùng"
              description="Thêm/sửa/xóa người dùng"
              icon={Users}
              onClick={() => navigate("/admin/users")}
            />
            <AdminAction
              label="Dữ liệu chính"
              description="Category, Supplier, Product"
              icon={Database}
              onClick={() => navigate("/admin/master-data")}
            />
            <AdminAction
              label="Cài đặt"
              description="Cấu hình hệ thống"
              icon={Settings}
              onClick={() => navigate("/admin/settings")}
            />
          </div>
        </CardContent>
      </Card>

      {/* RECENT ACTIVITIES */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử hệ thống</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Chức năng đang phát triển</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Sub-components
function SystemCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  onClick,
}: any) {
  const variants = {
    default: "border-slate-200",
    success: "border-green-200 bg-green-50",
    warning: "border-amber-200 bg-amber-50",
  };

  return (
    <Card
      className={`${variants[variant]} ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-6 h-6 text-muted-foreground" />
          <div className="text-right">
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <p className="text-sm font-medium">{title}</p>
      </CardContent>
    </Card>
  );
}

function AdminAction({ label, description, icon: Icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-3 p-4 rounded-lg border hover:bg-accent transition-colors text-left"
    >
      <div className="p-2 rounded bg-primary/10">
        <Icon className="w-5 h-5 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </button>
  );
}
