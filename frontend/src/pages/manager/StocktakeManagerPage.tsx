import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Plus, Play, Trash2, Eye, AlertTriangle, Package, Ban, Loader2
} from "lucide-react";

// 1. IMPORT SERVICE CÓ SẴN (Thay vì tạo mới)
import { stocktakeService } from "@/services/stocktake.service";
import { locationService } from "@/services/wms.Service"; // <--- Import từ wms.Service.ts

// 2. Import Types
import { StocktakeSession, StocktakeStatus } from "@/types/stocktake";
import { useToast } from "@/hooks/use-toast";
import { ZoneResponse } from "@/types/wms";

const ITEMS_PER_PAGE = 5;

const StocktakePageManager = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sessions, setSessions] = useState<StocktakeSession[]>([]);
  const [zones, setZones] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedZone, setSelectedZone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false); // Thêm state loading cho dropdown

  const [confirmAction, setConfirmAction] = useState<{
    isOpen: boolean;
    type: 'OPEN' | 'DELETE' | 'CLOSE';
    sessionId: number | null;
    sessionCode: string;
  }>({ isOpen: false, type: 'OPEN', sessionId: null, sessionCode: '' });

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await stocktakeService.getAllSessions();
      const sorted = res.data.sort((a, b) => (b.id || 0) - (a.id || 0));
      setSessions(sorted);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không thể tải danh sách phiên" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // --- HÀM LOAD ZONE (Dùng locationService có sẵn) ---
  const fetchZones = useCallback(async () => {
    try {
      setLoadingZones(true);
      // Gọi hàm có sẵn: getZones() trả về ZoneResponse[]
      const zonesData = await locationService.getZones();

      // Map dữ liệu: [{zoneName: "A"}, {zoneName: "B"}] -> ["A", "B"]
      // Lưu ý: Kiểm tra kỹ xem BE trả về field tên là 'zoneName' hay 'name'
      // Dựa trên file ZoneResponse.java bạn gửi thì là 'zoneName'
      const zoneList = zonesData.map((z: ZoneResponse) => z.zoneName);
      setZones(zoneList);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi tải Zone",
        description: "Không thể lấy danh sách khu vực. Vui lòng kiểm tra lại kết nối."
      });
    } finally {
      setLoadingZones(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Khi mở Modal thì mới load Zone
  useEffect(() => {
    if (isCreateModalOpen) {
      fetchZones();
    }
  }, [isCreateModalOpen, fetchZones]);

  const handleCreateSession = async () => {
    if (!selectedZone) return;
    setIsSubmitting(true);
    try {
      await stocktakeService.createSession({ zoneCode: selectedZone });
      toast({ title: "Thành công", description: `Đã tạo phiên kiểm kê cho Zone ${selectedZone}` });
      setIsCreateModalOpen(false);
      setSelectedZone("");
      fetchSessions();
      setCurrentPage(1);
    } catch (error) {
      // Xử lý lỗi từ Backend (Ví dụ: Zone đang kiểm kê rồi)
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
      if (type === 'OPEN') {
        await stocktakeService.openSession(sessionId);
        toast({ title: "Đã mở phiên", description: "Nhân viên có thể bắt đầu đếm." });
      } else if (type === 'DELETE') {
        await stocktakeService.deleteSession(sessionId);
        toast({ title: "Đã xóa", description: "Phiên kiểm kê đã bị hủy bỏ." });
      } else if (type === 'CLOSE') {
        await stocktakeService.closeSession(sessionId);
        toast({ title: "Đã đóng phiên", description: "Phiên kiểm kê đã kết thúc." });
      }
      fetchSessions();
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: error?.response?.data?.message || "Thao tác thất bại" });
    } finally {
      setConfirmAction({ ...confirmAction, isOpen: false });
    }
  };

  const handleNavigateDetail = (id: number) => {
    navigate(`/manager/stocktake/${id}`);
  };

  const getStatusBadge = (status: StocktakeStatus) => {
    switch (status) {
      case 'DRAFT': return <Badge variant="secondary">Nháp</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-600 hover:bg-blue-700">Đang kiểm</Badge>;
      case 'COMPLETED': return <Badge className="bg-green-600 hover:bg-green-700">Hoàn thành</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Đã hủy</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
  const currentData = sessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="w-7 h-7 text-primary" /> Quản lý Kiểm Kê Kho
          </h1>
          <p className="text-muted-foreground text-sm">Tạo phiếu, giám sát tiến độ và xử lý chênh lệch tồn kho.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-2 shadow-sm">
          <Plus className="w-4 h-4" /> Tạo Phiên Mới
        </Button>
      </div>

      {/* TABLE */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100/50">
              <TableRow>
                <TableHead className="w-[150px]">Mã Phiên</TableHead>
                <TableHead className="w-[50px]">Khu vực (Zone)</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="hidden md:table-cell">Tiến độ</TableHead>
                <TableHead className="hidden md:table-cell">Ngày tạo</TableHead>
                <TableHead className="hidden md:table-cell">Ngày hoàn thành</TableHead>
                <TableHead className="text-center pr-6">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center">Đang tải dữ liệu...</TableCell></TableRow>
              ) : currentData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Chưa có phiên kiểm kê nào.</TableCell></TableRow>
              ) : (
                currentData.map((session) => (
                  <TableRow key={session.id} className="hover:bg-gray-50 transition-colors">
                    <TableCell className="font-medium">{session.code}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="px-3 py-1 font-semibold">
                        {session.zoneCode || "N/A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(session.status)}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">
                      {session.countedItems} / {session.totalItems} items
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {session.startedAt ? (
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(session.startedAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(session.startedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">---</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {session.completedAt ? (
                        <div className="flex flex-col leading-tight">
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(session.completedAt).toLocaleDateString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(session.completedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">---</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {session.status === 'DRAFT' && (
                          <>
                            <Button size="sm" variant="default" className="gap-1 bg-blue-600 hover:bg-blue-700"
                              onClick={() => setConfirmAction({ isOpen: true, type: 'OPEN', sessionId: session.id, sessionCode: session.code })}>
                              <Play className="w-3.5 h-3.5" /> Mở
                            </Button>
                            <Button size="sm" variant="destructive" className="gap-1"
                              onClick={() => setConfirmAction({ isOpen: true, type: 'DELETE', sessionId: session.id, sessionCode: session.code })}>
                              <Trash2 className="w-3.5 h-3.5" /> Xóa
                            </Button>
                          </>
                        )}
                        {session.status === 'IN_PROGRESS' && (
                          <Button size="sm" variant="secondary" className="gap-1 text-orange-600 border-orange-200 hover:bg-orange-50"
                            onClick={() => setConfirmAction({ isOpen: true, type: 'CLOSE', sessionId: session.id, sessionCode: session.code })}>
                            <Ban className="w-3.5 h-3.5" /> Dừng
                          </Button>
                        )}
                        <Button size="sm" variant="outline" className="gap-1"
                          onClick={() => handleNavigateDetail(session.id)}>
                          <Eye className="w-3.5 h-3.5" /> Chi tiết
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center p-4 border-t">
              <span className="text-sm text-muted-foreground">Trang {currentPage} / {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>Trước</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* CREATE MODAL */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Tạo Phiên Kiểm Kê Mới</DialogTitle>
            <DialogDescription>Chọn khu vực (Zone) để bắt đầu kiểm kê.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Khu vực (Zone)</Label>
              <Select onValueChange={setSelectedZone} value={selectedZone}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingZones ? "Đang tải danh sách..." : "Chọn Zone (VD: A, B...)"} />
                </SelectTrigger>
                <SelectContent>
                  {zones.length > 0 ? (
                    zones.map(z => <SelectItem key={z} value={z}>Khu vực {z}</SelectItem>)
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {loadingZones ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Không tìm thấy Zone nào"}
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>Hủy bỏ</Button>
            <Button onClick={handleCreateSession} disabled={!selectedZone || isSubmitting}>
              {isSubmitting ? "Đang tạo..." : "Xác nhận & Khóa kệ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DIALOG */}
      <AlertDialog open={confirmAction.isOpen} onOpenChange={(open) => !open && setConfirmAction({ ...confirmAction, isOpen: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction.type === 'OPEN' && "Xác nhận mở phiên?"}
              {confirmAction.type === 'DELETE' && "Xác nhận xóa phiên?"}
              {confirmAction.type === 'CLOSE' && "Dừng/Đóng phiên này?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction.type === 'OPEN' && (
                <div className="flex flex-col gap-4">
                  {/* Nội dung thông báo chính */}
                  <p>
                    Bạn có chắc muốn mở phiên <strong>"{confirmAction.sessionCode}"</strong>?
                    Nhân viên sẽ bắt đầu nhìn thấy nhiệm vụ trên thiết bị cầm tay.
                  </p>

                  {/* Box cảnh báo LOCK kệ */}
                  <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-md text-left">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div className="text-sm text-amber-800">
                      <p className="font-bold">Lưu ý quan trọng:</p>
                      <p>
                        Hệ thống sẽ <strong>KHÓA (LOCK)</strong> toàn bộ kệ thuộc Zone này.
                        Mọi hoạt động nhập/xuất hàng sẽ bị chặn.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {confirmAction.type === 'DELETE' && `Hành động này không thể hoàn tác. Phiên "${confirmAction.sessionCode}" sẽ bị xóa vĩnh viễn.`}
              {confirmAction.type === 'CLOSE' && `Bạn muốn kết thúc sớm phiên "${confirmAction.sessionCode}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={executeConfirmAction} className={confirmAction.type === 'DELETE' ? "bg-red-600 hover:bg-red-700" : ""}>
              {confirmAction.type === 'DELETE' ? "Xóa ngay" : "Đồng ý"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StocktakePageManager;