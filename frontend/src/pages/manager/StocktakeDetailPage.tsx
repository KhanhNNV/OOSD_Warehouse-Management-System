import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronRight, ArrowLeft, CheckCircle2, AlertTriangle, 
  HelpCircle, Package, AlertCircle, Barcode 
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  HoverCard, HoverCardContent, HoverCardTrigger 
} from "@/components/ui/hover-card";

import { stocktakeService } from "@/services/stocktake.service";
import { StocktakeSessionDetail } from "@/types/stocktake";
import { useToast } from "@/hooks/use-toast";

const StocktakeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<StocktakeSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (id) fetchSessionDetail(Number(id));
  }, [id]);

  const formatDateTime = (dateTimeStr: string | undefined) => {
    if (!dateTimeStr) return <span className="text-muted-foreground text-[10px]">---</span>;
    const dateObj = new Date(dateTimeStr);
    return (
      <div className="flex flex-col leading-tight">
        <span className="text-xs font-medium text-gray-700">{dateObj.toLocaleDateString('vi-VN')}</span>
        <span className="text-[10px] text-muted-foreground">{dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    );
  };

  const fetchSessionDetail = async (sessionId: number) => {
    try {
      setLoading(true);
      const res = await stocktakeService.getSessionDetail(sessionId);
      setSession(res.data);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không tải được dữ liệu" });
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (assignmentId: number) => {
    setExpandedRows(prev => ({ ...prev, [assignmentId]: !prev[assignmentId] }));
  };

  if (loading) return <div className="p-10 text-center animate-pulse">Đang tải dữ liệu...</div>;
  if (!session) return <div className="p-10 text-center text-red-500">Không tìm thấy phiên kiểm kê.</div>;

  const assignments = session.details || [];

  // --- 1. TÍNH TOÁN TỔNG LỖI CỦA TOÀN BỘ PHIÊN ---
  const totalSessionErrors = assignments.reduce((sum, assign) => {
    const details = assign.details || [];
    const errs = details.filter(d => d.actualCountedQty != null && d.actualCountedQty !== d.systemQtySnapshot).length;
    return sum + errs;
  }, 0);

  // Xác định màu sắc cho Header dựa trên lỗi
  const sessionStatusColor = totalSessionErrors > 0 ? "text-red-600 border-red-200 bg-red-50" : "text-blue-600 border-blue-200 bg-blue-50";

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              Phiên: {session.code} 
              {/* --- 2. BADGE TRẠNG THÁI PHIÊN CŨNG BỊ ĐỎ NẾU CÓ LỖI --- */}
              <Badge variant={totalSessionErrors > 0 ? "destructive" : "outline"} className="text-lg">
                {session.status}
              </Badge>
            </h1>
            <p className="text-muted-foreground text-sm">
              Khu vực: {session.zoneCode} • Tổng SP: {session.totalItems} • Đã đếm: {session.countedItems}
            </p>
          </div>
        </div>

        {/* Thẻ hiển thị nhanh tổng lỗi toàn phiên */}
        {totalSessionErrors > 0 && (
          <div className={`px-4 py-2 rounded-lg border flex items-center gap-2 ${sessionStatusColor}`}>
             <AlertTriangle className="w-5 h-5" />
             <span className="font-bold">Phát hiện {totalSessionErrors} sai lệch trong phiên này</span>
          </div>
        )}
      </div>

      {/* CARD CHÍNH - Viền trên đỏ nếu có lỗi */}
      <Card className={`shadow-sm border-t-4 ${totalSessionErrors > 0 ? "border-t-red-500" : "border-t-blue-600"}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex justify-between items-center">
             <span>Danh sách Nhiệm vụ theo Kệ</span>
             {totalSessionErrors > 0 && <span className="text-xs text-red-500 font-normal italic">* Các dòng màu đỏ cần kiểm tra lại</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100/80">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead className="w-[120px]">Vị trí (Kệ)</TableHead>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Kết thúc</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
                <TableHead className="text-right pr-6">Đánh giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assignments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                    <div className="flex flex-col items-center justify-center">
                       <AlertCircle className="w-8 h-8 mb-2 text-gray-300" />
                       Chưa có kệ nào được tạo.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                assignments.map((assign) => {
                  const isExpanded = expandedRows[assign.id];
                  const details = assign.details || [];
                  const errorCount = details.filter(d => d.actualCountedQty != null && d.actualCountedQty !== d.systemQtySnapshot).length;
                  
                  // --- 3. LOGIC ĐỔI MÀU DÒNG ASSIGNMENT (ASSIGNMENT BỊ ĐỎ NHẸ) ---
                  let rowClass = "cursor-pointer transition-colors duration-200 border-l-4 ";
                  
                  if (errorCount > 0) {
                     // Trường hợp CÓ LỖI
                     if (isExpanded) {
                        rowClass += "bg-red-50 border-l-red-500"; // Đang mở + Lỗi
                     } else {
                        rowClass += "bg-red-50/60 hover:bg-red-100 border-l-red-300"; // Đóng + Lỗi (Đỏ nhẹ)
                     }
                  } else {
                     if (isExpanded) {
                        rowClass += "bg-blue-50/60 border-l-blue-500";
                     } else {
                        rowClass += "hover:bg-blue-50/40 border-l-transparent";
                     }
                  }

                  return (
                    <React.Fragment key={assign.id}>
                      {/* --- DÒNG CHA --- */}
                      <TableRow 
                        className={rowClass}
                        onClick={() => toggleRow(assign.id)}
                      >
                        <TableCell>
                          <ChevronRight 
                            className={`w-4 h-4 text-gray-500 transition-transform duration-300 ease-in-out ${isExpanded ? "rotate-90" : ""}`} 
                          />
                        </TableCell>
                        
                        {/* Nếu có lỗi, tô đỏ text mã kệ luôn cho dễ thấy */}
                        <TableCell className={`font-bold ${errorCount > 0 ? "text-red-700" : "text-blue-900"}`}>
                            {assign.locationCode}
                        </TableCell>
                        
                        <TableCell>
                          {assign.staffName ? (
                            <div className="flex items-center gap-2 font-medium text-gray-700">
                               <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${errorCount > 0 ? "bg-red-200 text-red-700" : "bg-blue-100 text-blue-600"}`}>
                                 {assign.staffName.charAt(0)}
                               </div>
                               {assign.staffName}
                            </div>
                          ) : <span className="text-gray-400 italic text-sm">Chưa nhận</span>}
                        </TableCell>

                        <TableCell>{formatDateTime(assign.startedAt)}</TableCell>
                        <TableCell>{formatDateTime(assign.completedAt)}</TableCell>

                        <TableCell className="text-center">
                           <Badge variant={assign.status === 'COMPLETED' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                              {assign.status}
                           </Badge>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end items-center gap-2">
                             {assign.status === 'COMPLETED' ? (
                                errorCount > 0 ? (
                                   <div className="flex items-center gap-1 text-red-700 bg-white border border-red-200 px-2 py-0.5 rounded shadow-sm">
                                      <AlertTriangle className="w-3 h-3 text-red-600" />
                                      <span className="text-[10px] font-bold">{errorCount}</span>
                                   </div>
                                ) : <CheckCircle2 className="w-5 h-5 text-green-500" />
                             ) : <HelpCircle className="w-5 h-5 text-gray-200" />}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* --- DÒNG CON --- */}
                      {isExpanded && (
                        <TableRow className="bg-gray-50/30 hover:bg-transparent border-none">
                          <TableCell colSpan={7} className="p-0 border-b-0">
                            <div className="w-full py-6 animate-in fade-in zoom-in-[0.98] duration-300 ease-out origin-top">
                                
                                <div className={`mx-auto w-[96%] max-w-[1200px] bg-white rounded-xl border shadow-lg overflow-hidden ${errorCount > 0 ? "border-red-200" : ""}`}>
                                    
                                    {/* Header bảng con cũng đỏ theo nếu có lỗi */}
                                    <div className={`px-5 py-3 border-b flex items-center justify-between ${errorCount > 0 ? "bg-red-50" : "bg-gray-50"}`}>
                                        <div className="flex items-center gap-2">
                                            <Package className={`w-4 h-4 ${errorCount > 0 ? "text-red-600" : "text-blue-600"}`} />
                                            <span className={`text-xs font-bold uppercase ${errorCount > 0 ? "text-red-700" : "text-gray-600"}`}>
                                                Chi tiết tại {assign.locationCode}
                                            </span>
                                        </div>
                                        {errorCount > 0 && <Badge variant="destructive">Lệch {errorCount} SP</Badge>}
                                    </div>

                                    <Table>
                                        <TableHeader className="bg-gray-50/50">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="text-[11px] font-bold pl-6">SẢN PHẨM</TableHead>
                                                <TableHead className="text-[11px] font-bold">TÊN CHI TIẾT</TableHead>
                                                <TableHead className="text-[11px] font-bold text-right w-[100px]">HỆ THỐNG</TableHead>
                                                <TableHead className="text-[11px] font-bold text-right w-[100px]">THỰC TẾ</TableHead>
                                                <TableHead className="text-[11px] font-bold text-right w-[100px] pr-6">CHÊNH LỆCH</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {details.length > 0 ? details.map((d) => {
                                                const diff = (d.actualCountedQty ?? 0) - d.systemQtySnapshot;
                                                const isError = d.actualCountedQty != null && diff !== 0;
                                                return (
                                                    <TableRow key={d.id} className={`group ${isError ? "bg-red-50/40" : "hover:bg-gray-50"}`}>
                                                        <TableCell className="pl-6 py-2">
                                                            <div className="flex items-center gap-3">
                                                              <HoverCard>
                                                                <HoverCardTrigger asChild>
                                                                  <Avatar className={`h-9 w-9 rounded-md border bg-gray-50 cursor-zoom-in transition-all duration-200 ${isError ? "border-red-300 hover:ring-red-400" : "hover:ring-blue-400"}`}>
                                                                    <AvatarImage src={d.productImage} alt={d.productSku} className="object-cover" />
                                                                    <AvatarFallback className="text-[9px] font-bold">{d.productSku.slice(0,2)}</AvatarFallback>
                                                                  </Avatar>
                                                                </HoverCardTrigger>
                                                                <HoverCardContent side="right" align="start" sideOffset={10} className="w-48 p-1 z-[100] bg-white shadow-2xl border-2 border-blue-100 rounded-lg">
                                                                  <div className="relative">
                                                                      <img src={d.productImage || "/placeholder-image.png"} alt={d.productName} className="w-full h-auto rounded-md bg-white" />
                                                                  </div>
                                                                </HoverCardContent>
                                                              </HoverCard>
                                                              <div className="flex flex-col">
                                                                <span className={`text-xs font-mono font-bold transition-colors ${isError ? "text-red-700" : "text-gray-700 group-hover:text-blue-600"}`}>{d.productSku}</span>
                                                                <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                                  <Barcode className="w-3 h-3" /> {d.productBarcode || "---"}
                                                                </span>
                                                              </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-gray-700 font-medium">{d.productName}</TableCell>
                                                        <TableCell className="text-right text-xs text-gray-500">{d.systemQtySnapshot}</TableCell>
                                                        <TableCell className="text-right text-xs font-bold text-blue-700">
                                                            {d.actualCountedQty ?? <span className="text-gray-300">--</span>}
                                                        </TableCell>
                                                        <TableCell className="text-right text-xs pr-6">
                                                            {d.actualCountedQty != null ? (
                                                                diff === 0 ? <span className="text-green-600 font-bold text-[15px] bg-green-50 px-2 py-1 rounded">0</span> : 
                                                                <span className={`font-bold px-2 py-1 rounded text-[15px] ${diff > 0 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"}`}>
                                                                    {diff > 0 ? `+${diff}` : diff}
                                                                </span>
                                                            ) : "---"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            }) : (
                                                <TableRow><TableCell colSpan={5} className="text-center py-8 text-xs text-gray-400 italic">Chưa có dữ liệu</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default StocktakeDetailPage;