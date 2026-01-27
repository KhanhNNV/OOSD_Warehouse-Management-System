import { useState, useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, FileText, Receipt, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function AccountantDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingInvoices: 0,
    paidInvoices: 0,
    totalRevenue: 0,
    totalExpense: 0,
  });

  useEffect(() => {
    // Load financial data
    loadFinanceStats();
  }, []);

  const loadFinanceStats = async () => {
    // Implement based on your API
    setStats({
      pendingInvoices: 8,
      paidInvoices: 45,
      totalRevenue: 250000000,
      totalExpense: 180000000,
    });
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Tổng quan tài chính"
        description="Quản lý hóa đơn và báo cáo tài chính"
      />

      {/* FINANCIAL METRICS */}
      <div className="grid gap-4 md:grid-cols-4">
        <FinanceCard
          title="Hóa đơn chờ"
          value={stats.pendingInvoices}
          icon={FileText}
          variant="warning"
          onClick={() => navigate("/accountant/supplier-invoices")}
        />
        <FinanceCard
          title="Đã thanh toán"
          value={stats.paidInvoices}
          icon={Receipt}
          variant="success"
        />
        <FinanceCard
          title="Doanh thu tháng"
          value={`${(stats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={TrendingUp}
          variant="success"
        />
        <FinanceCard
          title="Chi phí tháng"
          value={`${(stats.totalExpense / 1000000).toFixed(1)}M`}
          icon={DollarSign}
        />
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/accountant/supplier-invoices")}
        >
          <CardHeader>
            <CardTitle className="text-base">Hóa đơn nhập hàng (NCC)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Quản lý thanh toán cho nhà cung cấp
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/accountant/invoices")}
        >
          <CardHeader>
            <CardTitle className="text-base">Xuất hóa đơn bán</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tạo hóa đơn cho khách hàng
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FinanceCard({
  title,
  value,
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
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <Icon className="w-8 h-8 opacity-50" />
        </div>
      </CardContent>
    </Card>
  );
}
