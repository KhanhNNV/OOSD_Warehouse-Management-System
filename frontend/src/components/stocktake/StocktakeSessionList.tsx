import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, MoreHorizontal, Play, CheckCircle } from "lucide-react";
import { StocktakeSession } from "@/types/wms";
import { StatusBadge, StatusType } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StocktakeSessionListProps {
  sessions: StocktakeSession[];
  onStatusChange: (id: string, status: StocktakeSession["status"]) => void;
}

export function StocktakeSessionList({ sessions, onStatusChange }: StocktakeSessionListProps) {
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgress = (session: StocktakeSession) => {
    if (session.totalItems === 0) return 0;
    return Math.round((session.countedItems / session.totalItems) * 100);
  };

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-table-header hover:bg-table-header">
            <TableHead className="font-semibold">Tên phiên</TableHead>
            <TableHead className="font-semibold">Loại</TableHead>
            <TableHead className="font-semibold">Khu vực/Danh mục</TableHead>
            <TableHead className="font-semibold">Trạng thái</TableHead>
            <TableHead className="font-semibold">Tiến độ</TableHead>
            <TableHead className="font-semibold">Chênh lệch</TableHead>
            <TableHead className="font-semibold">Ngày tạo</TableHead>
            <TableHead className="font-semibold w-[100px]">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sessions.map((session) => (
            <TableRow
              key={session.id}
              className={cn(
                "cursor-pointer transition-colors",
                session.varianceCount > 0 && session.status !== "completed"
                  ? "bg-variance-bg/50 hover:bg-variance-bg"
                  : "hover:bg-table-row-hover"
              )}
              onClick={() => navigate(`/stocktake/${session.id}`)}
            >
              <TableCell className="font-medium">{session.name}</TableCell>
              <TableCell>
                {session.type === "zone" ? "Theo khu vực" : "Theo danh mục"}
              </TableCell>
              <TableCell>{session.zone || session.category || "-"}</TableCell>
              <TableCell>
                <StatusBadge status={session.status as StatusType} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 min-w-[120px]">
                  <Progress value={getProgress(session)} className="h-2" />
                  <span className="text-sm text-muted-foreground">
                    {getProgress(session)}%
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {session.varianceCount > 0 ? (
                  <span className="text-destructive font-medium">
                    {session.varianceCount} sản phẩm
                  </span>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(session.createdAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/stocktake/${session.id}`);
                    }}>
                      <Eye className="w-4 h-4 mr-2" />
                      Xem chi tiết
                    </DropdownMenuItem>
                    {session.status === "draft" && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(session.id, "open");
                      }}>
                        <Play className="w-4 h-4 mr-2" />
                        Bắt đầu kiểm kê
                      </DropdownMenuItem>
                    )}
                    {session.status === "open" && (
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange(session.id, "completed");
                      }}>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Hoàn thành
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
