import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Label } from "@/components/ui/label";
import {
  Plus,
  Play,
  Trash2,
  Eye,
  AlertTriangle,
  Package,
  Ban,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { stocktakeService } from "@/services/stocktake.service";
import { locationService } from "@/services/wms.Service";
import { StocktakeSession, VarianceReportResponse } from "@/types/stocktake";
import { useToast } from "@/hooks/use-toast";
import { ZoneResponse } from "@/types/wms";
import VarianceReportModal from "@/components/stocktake/VarianceReportModal";

const ITEMS_PER_PAGE = 8;

const StocktakeManagerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get("page") || "1");

  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: "OPEN" | "DELETE" | "CLOSE";
    sessionId: number | null;
    sessionCode: string;
  }>({ isOpen: false, type: "OPEN", sessionId: null, sessionCode: "" });

  // State cho Variance Report Modal
  const [reportModal, setReportModal] = useState<{
    isOpen: boolean;
    report: VarianceReportResponse | null;
    sessionId: number | null;
    canAdjust: boolean;
  }>({ isOpen: false, report: null, sessionId: null, canAdjust: false });
  const [isApproving, setIsApproving] = useState(false);

  const formatDateTime = (dateTimeStr: string | undefined) => {
    if (!dateTimeStr)
      return <span className="text-muted-foreground text-[10px]">---</span>;
    const dateObj = new Date(dateTimeStr);
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium text-gray-700">
          {dateObj.toLocaleDateString("vi-VN")}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {dateObj.toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  };
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Gọi API có phân trang (page - 1 vì Backend đếm từ 0)
      const res = await stocktakeService.getAllSessions(
        currentPage - 1,
        ITEMS_PER_PAGE,
      );

      // 2. Xử lý dữ liệu trả về chuẩn Page
      if (res.data && res.data.content) {
        // Backend đã sort sẵn rồi (DRAFT lên đầu), không cần sort lại ở đây nữa
        setSessions(res.data.content);
        setTotalPages(res.data.totalPages);
      }
      // Fallback: Đề phòng backend chưa update kịp, vẫn trả về mảng thường
      else if (Array.isArray(res.data)) {
        setSessions(res.data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Lỗi fetch:", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách phiên",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, currentPage]);

  const fetchZones = useCallback(async () => {
    try {
      setLoadingZones(true);
      const zonesData = await locationService.getZones();
      const zoneList = zonesData.map((z: ZoneResponse) => z.zoneName);
      setZones(zoneList);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi tải Zone",
        description: "Không thể lấy danh sách khu vực.",
      });
    } finally {
      setLoadingZones(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (isCreateModalOpen) fetchZones();
  }, [isCreateModalOpen, fetchZones]);

  const handleCreateSession = async () => {
    if (!selectedZone) return;
    setIsSubmitting(true);
    try {
      await stocktakeService.createSession({ zoneCode: selectedZone });
      toast({
        title: "Thành công",
        description: `Đã tạo phiên kiểm kê cho Zone ${selectedZone}`,
      });
      setIsCreateModalOpen(false);
      setSearchParams({ page: "1" });
      setSelectedZone("");
      fetchSessions();
    } catch (error) {
      const msg = error?.response?.data?.message || "Không thể tạo phiên";
      toast({ variant: "destructive", title: "Thất bại", description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeConfirmAction = async () => {
    const { type, sessionId } = confirmAction;
    if (!sessionId) return;

    try {
      if (type === "OPEN") {
        await stocktakeService.openSession(sessionId);
        toast({
          title: "Đã mở phiên",
          description: "Nhân viên có thể bắt đầu đếm.",
        });
      } else if (type === "DELETE") {
        await stocktakeService.deleteSession(sessionId);
        toast({ title: "Đã xóa", description: "Phiên kiểm kê đã bị hủy bỏ." });
      } else if (type === "CLOSE") {
        await stocktakeService.closeSession(sessionId);
        toast({
          title: "Đã đóng phiên",
          description: "Phiên kiểm kê đã kết thúc.",
        });
      }
      fetchSessions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error?.response?.data?.message || "Thao tác thất bại",
      });
    } finally {
      setConfirmAction({ ...confirmAction, isOpen: false });
    }
  };

  // Mở modal báo cáo sai lệch
  const openReportModal = async (session: StocktakeSession) => {
    try {
      const res = await stocktakeService.getVarianceReport(session.id);
      setReportModal({
        isOpen: true,
        report: res.data,
        sessionId: session.id,
        canAdjust: session.status === "NEEDS_ADJUSTMENT",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải báo cáo sai lệch",
      });
    }
  };

  // Xác nhận điều chỉnh tồn kho (nhận adjustments từ modal)
  const handleApproveAdjustment = async (adjustments: { detailId: number; newQuantity: number }[]) => {
    if (!reportModal.sessionId) return;
    setIsApproving(true);
    try {
      await stocktakeService.approveAdjustment({
        sessionId: reportModal.sessionId,
        adjustments: adjustments
      });
      toast({
        title: "Thành công",
        description: "Đã điều chỉnh tồn kho theo số lượng bạn đã chỉnh sửa",
      });
      setReportModal({ isOpen: false, report: null, sessionId: null, canAdjust: false });
      fetchSessions();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: error?.response?.data?.message || "Điều chỉnh thất bại",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const renderStatus = (session: StocktakeSession) => {
    switch (session.status) {
      case "DRAFT":
        return <Badge variant="secondary">Bản nháp</Badge>;
      case "IN_PROGRESS":
        return (
          <Badge className="bg-blue-600 hover:bg-blue-700">Đang kiểm</Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            Hoàn thành
          </Badge>
        );
      case "NEEDS_ADJUSTMENT":
        return (
          <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-red-200 flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3 h-3" />
            Cần điều chỉnh
          </Badge>
        );
      case "ADJUSTED":
        return (
          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            Đã điều chỉnh
          </Badge>
        );
      default:
        return <Badge variant="outline">{session.status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Quản lý Kiểm Kê Kho
          </h1>
          <p className="text-muted-foreground text-sm">
            Tạo phiếu, giám sát tiến độ và xử lý chênh lệch tồn kho.
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Tạo Phiên Mới
        </Button>
      </div>

      {/* TABLE */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardContent className="p-0">
          <TooltipProvider>
            <Table>
              <TableHeader className="bg-gray-100/50">
                <TableRow>
                  <TableHead className="w-[200px]">Mã Phiên</TableHead>
                  <TableHead className="w-[80px]">Zone</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden md:table-cell text-center w-[50px]">
                    Chênh lệch
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Tiến độ
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Ngày tạo
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Ngày xong
                  </TableHead>
                  <TableHead className="text-center pr-6">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="h-32 text-center text-muted-foreground"
                    >
                      Chưa có phiên kiểm kê nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => (
                    <TableRow
                      key={session.id}
                      className={`
                        transition-colors border-b
                        ${session.varianceCount > 0
                          ? "bg-red-50 hover:bg-red-100 border-red-200" // Có lỗi: Nền đỏ, viền đỏ
                          : "hover:bg-gray-50" // Bình thường: Hover xám
                        }
                      `}
                    >
                      <TableCell className="font-medium">
                        {session.code}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 font-bold font-mono"
                        >
                          {session.zoneCode || "N/A"}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderStatus(session)}</TableCell>

                      <TableCell className="hidden md:table-cell text-center">
                        {session.varianceCount > 0 ? (
                          <span className="text-red-700 font-extrabold flex items-center justify-center gap-1 text-base">
                            -{session.varianceCount}
                          </span>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </TableCell>

                      <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{
                                width: `${Math.min((session.countedItems / session.totalItems) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span
                            className={
                              session.varianceCount > 0
                                ? "text-red-700 font-medium"
                                : ""
                            }
                          >
                            {session.countedItems}/{session.totalItems}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>{formatDateTime(session.startedAt)}</TableCell>
                      <TableCell>
                        {formatDateTime(session.completedAt)}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {session.status === "DRAFT" && (
                            <>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() =>
                                      setConfirmAction({
                                        isOpen: true,
                                        type: "OPEN",
                                        sessionId: session.id,
                                        sessionCode: session.code,
                                      })
                                    }
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Mở phiếu</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() =>
                                      setConfirmAction({
                                        isOpen: true,
                                        type: "DELETE",
                                        sessionId: session.id,
                                        sessionCode: session.code,
                                      })
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Xóa phiếu</p>
                                </TooltipContent>
                              </Tooltip>
                            </>
                          )}

                          {session.status === "IN_PROGRESS" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() =>
                                    setConfirmAction({
                                      isOpen: true,
                                      type: "CLOSE",
                                      sessionId: session.id,
                                      sessionCode: session.code,
                                    })
                                  }
                                >
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Dừng / Đóng phiên</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Nút Xem báo cáo cho phiên cần điều chỉnh hoặc đã điều chỉnh */}
                          {(session.status === "NEEDS_ADJUSTMENT" || session.status === "ADJUSTED") && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant={session.status === "NEEDS_ADJUSTMENT" ? "destructive" : "outline"}
                                  className="h-8 gap-1"
                                  onClick={() => openReportModal(session)}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  Báo cáo
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Xem báo cáo sai lệch</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 gap-1 bg-white"
                                onClick={() =>
                                  navigate(`/manager/stocktake/${session.id}`)
                                }
                              >
                                <Eye className="w-3.5 h-3.5" /> Xem
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Xem chi tiết</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t flex justify-end">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setSearchParams({ page: (currentPage - 1).toString() })
                  }
                >
                  Trước
                </Button>
                <span className="text-sm text-gray-600 font-medium">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setSearchParams({ page: (currentPage + 1).toString() })
                  }
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tạo Phiên Kiểm Kê Mới</DialogTitle>
            <DialogDescription>
              Chọn khu vực (Zone) để bắt đầu kiểm kê.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Khu vực (Zone)</Label>
              <Select onValueChange={setSelectedZone} value={selectedZone}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loadingZones ? "Đang tải danh sách..." : "Chọn Zone"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {zones.length > 0 ? (
                    zones.map((z) => (
                      <SelectItem key={z} value={z}>
                        Khu vực {z}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {loadingZones ? (
                        <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                      ) : (
                        "Không tìm thấy Zone nào"
                      )}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={handleCreateSession}
              disabled={!selectedZone || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Tạo phiên
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DIALOG - CÓ CẢNH BÁO LOCK VÀNG */}
      <AlertDialog
        open={confirmAction.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmAction({ ...confirmAction, isOpen: false })
        }
      >
        <AlertDialogContent className="max-w-[500px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận hành động</AlertDialogTitle>

            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                {/* 1. MỞ PHIẾU -> HIỆN CẢNH BÁO LOCK */}
                {confirmAction.type === "OPEN" && (
                  <div className="flex flex-col gap-4 mt-2">
                    <p>
                      Bạn có chắc muốn mở phiên{" "}
                      <strong>"{confirmAction.sessionCode}"</strong>?
                      <br />
                      Nhân viên sẽ bắt đầu nhìn thấy nhiệm vụ trên ứng dụng.
                    </p>

                    {/* BOX VÀNG CẢNH BÁO */}
                    <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
                      <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                      <div className="text-sm text-amber-800">
                        <p className="font-bold">Lưu ý quan trọng:</p>
                        <p>
                          Hệ thống sẽ <strong>KHÓA (LOCK)</strong> toàn bộ kệ
                          thuộc Zone này. Mọi hoạt động nhập/xuất hàng sẽ bị
                          chặn cho đến khi kiểm kê xong.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. CÁC TRƯỜNG HỢP KHÁC */}
                {confirmAction.type === "DELETE" && (
                  <span className="text-red-600">
                    Hành động này không thể hoàn tác. Phiên kiểm kê{" "}
                    <strong>{confirmAction.sessionCode}</strong> sẽ bị xóa vĩnh
                    viễn khỏi hệ thống.
                  </span>
                )}

                {confirmAction.type === "CLOSE" && (
                  <span>
                    Bạn muốn kết thúc phiên{" "}
                    <strong>{confirmAction.sessionCode}</strong> ngay lập tức?
                    <br />
                    Các kết quả chưa đếm sẽ được chốt là 0.
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeConfirmAction}
              className={
                confirmAction.type === "DELETE"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {confirmAction.type === "DELETE" ? "Xóa vĩnh viễn" : "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VARIANCE REPORT MODAL */}
      <VarianceReportModal
        isOpen={reportModal.isOpen}
        onClose={() => setReportModal({ isOpen: false, report: null, sessionId: null, canAdjust: false })}
        report={reportModal.report}
        onApprove={handleApproveAdjustment}
        isApproving={isApproving}
        canAdjust={reportModal.canAdjust}
      />
    </div>
  );
};

export default StocktakeManagerPage;
