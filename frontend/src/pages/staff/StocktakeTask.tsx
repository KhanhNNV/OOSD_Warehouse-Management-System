import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { stocktakeService } from "@/services/stocktake.service";
import { StocktakeAssignment } from "@/types/stocktake";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import { MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

export default function StocktakeTask() {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState<StocktakeAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await stocktakeService.getStaffAssignments();
      if (res.data) {
        setAssignments(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleStartTask = async (id: number) => {
    try {
      // Gọi API Start để KHÓA nhiệm vụ
      await stocktakeService.startAssignment(id);
      toast({
        title: "Đã nhận nhiệm vụ",
        description: "Bắt đầu kiểm đếm ngay!",
        variant: "default",
      });
      // Chuyển sang màn hình đếm
      navigate(`/staff/stocktake/${id}`);
    } catch (error) {
      toast({
        title: "Không thể nhận nhiệm vụ",
        description:
          error.response?.data?.message ||
          "Nhiệm vụ này đã bị người khác nhận hoặc đã xong.",
        variant: "destructive",
      });
      // Reload lại danh sách để ẩn cái vừa bị lỗi đi
      fetchAssignments();
    }
  };

  return (
    <div className="pb-20 bg-gray-50 min-h-screen">
      <div className="p-4 bg-white shadow-sm mb-4">
        <PageHeader
          title="Nhiệm vụ kiểm kê"
          description="Danh sách kệ cần kiểm đếm"
        />
      </div>

      <div className="px-4 space-y-4">
        {assignments.length === 0 && !loading && (
          <div className="text-center py-10 text-gray-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>Hiện không có nhiệm vụ nào.</p>
          </div>
        )}

        {assignments.map((task) => (
          <Card
            key={task.id}
            className="active:scale-[0.98] transition-transform shadow-sm border-l-4 border-l-blue-500"
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  {task.locationCode}
                </CardTitle>
                <Badge
                  variant={
                    task.status === "IN_PROGRESS" ? "default" : "secondary"
                  }
                >
                  {task.status === "IN_PROGRESS" ? "Đang làm" : "Mới"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-1">
                {/* 6. Hiển thị thông tin phiên */}
                <p>
                  Phiên: <span className="font-medium text-gray-900">{}</span>
                </p>
                {task.startedAt && (
                  <div className="flex items-center gap-1 text-xs text-blue-600">
                    <Calendar className="w-3 h-3" />
                    Bắt đầu: {format(new Date(task.startedAt), "dd/MM HH:mm")}
                  </div>
                )}
              </div>

              <Button
                className={`w-full mt-4 h-12 text-md font-medium
                ${
                  task.status === "IN_PROGRESS"
                    ? "bg-yellow-500 hover:bg-yellow-600 text-black"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }
              `}
                onClick={() => handleStartTask(task.id)}
              >
                {task.status === "IN_PROGRESS" ? "Tiếp tục đếm" : "Bắt đầu đếm"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
