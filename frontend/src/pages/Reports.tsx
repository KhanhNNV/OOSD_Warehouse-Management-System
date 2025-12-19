import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBarChart, Download, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  {
    title: "Báo cáo Nhập kho",
    description: "Tổng hợp các đơn nhập hàng theo thời gian",
    icon: FileBarChart,
  },
  {
    title: "Báo cáo Xuất kho",
    description: "Tổng hợp các đơn xuất hàng và doanh thu",
    icon: FileBarChart,
  },
  {
    title: "Báo cáo Kiểm kê",
    description: "Kết quả các phiên kiểm kê và chênh lệch",
    icon: FileBarChart,
  },
  {
    title: "Báo cáo Tồn kho",
    description: "Số lượng tồn kho theo sản phẩm/khu vực",
    icon: FileBarChart,
  },
];

export default function ReportsPage() {
  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Báo cáo"
        description="Xem và xuất các báo cáo kho hàng"
        action={
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Chọn khoảng thời gian
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <report.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg">{report.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.description}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Xem báo cáo
                </Button>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Xuất Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
