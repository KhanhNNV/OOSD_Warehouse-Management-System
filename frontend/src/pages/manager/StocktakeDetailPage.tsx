import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ChevronDown, ChevronRight, ArrowLeft, CheckCircle2, AlertTriangle, 
  HelpCircle, Package, AlertOctagon 
} from "lucide-react";

import { stocktakeService } from "@/services/stocktake.service";
import { StocktakeSessionDetail, StocktakeDetail } from "@/types/stocktake";
import { useToast } from "@/hooks/use-toast";

// Interface hỗ trợ Gom nhóm dữ liệu
interface GroupedLocation {
  locationCode: string;
  items: StocktakeDetail[];
  totalVariance: number; // Tổng chênh lệch tuyệt đối
  hasDiscrepancy: boolean; // Có sai lệch hay không
  isCounted: boolean; // Đã có dữ liệu đếm chưa
}

const StocktakeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [session, setSession] = useState<StocktakeSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // State quản lý việc đóng/mở từng dòng (Lưu danh sách locationCode đang mở)
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (id) fetchSessionDetail(Number(id));
  }, [id]);

  const fetchSessionDetail = async (sessionId: number) => {
    try {
      setLoading(true);
      const res = await stocktakeService.getSessionDetail(sessionId);
      setSession(res.data);
    } catch (error) {
      toast({ variant: "destructive", title: "Lỗi", description: "Không tải được chi tiết phiên" });
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIC GOM NHÓM (QUAN TRỌNG) ---
  // API trả về list phẳng, ta gom lại theo Location để hiển thị Accordion
  const groupedData = useMemo(() => {
    if (!session || !session.details) return [];

    const map = new Map<string, StocktakeDetail[]>();

    // 1. Gom sản phẩm vào từng Location
    session.details.forEach((item) => {
      const loc = item.locationCode;
      if (!map.has(loc)) map.set(loc, []);
      map.get(loc)?.push(item);
    });

    // 2. Tính toán chỉ số cho từng Location
    const result: GroupedLocation[] = [];
    map.forEach((items, locationCode) => {
      let totalVariance = 0;
      let hasDiscrepancy = false;
      let hasActualData = false;

      items.forEach(item => {
        // Nếu đã có số thực tế (khác undefined/null)
        if (item.actualCountedQty !== undefined && item.actualCountedQty !== null) {
          hasActualData = true;
          const diff = item.actualCountedQty - item.systemQtySnapshot;
          if (diff !== 0) {
            totalVariance += Math.abs(diff);
            hasDiscrepancy = true;
          }
        }
      });

      result.push({
        locationCode,
        items,
        totalVariance,
        hasDiscrepancy,
        isCounted: hasActualData
      });
    });

    // Sắp xếp: Kệ nào có lỗi (Discrepancy) cho lên đầu để Manager dễ thấy
    return result.sort((a, b) => (Number(b.hasDiscrepancy) - Number(a.hasDiscrepancy)) || a.locationCode.localeCompare(b.locationCode));
  }, [session]);

  // --- HANDLERS ---
  const toggleRow = (locationCode: string) => {
    setExpandedRows(prev => ({
      ...prev,
      [locationCode]: !prev[locationCode]
    }));
  };

  if (loading) return <div className="p-10 text-center">Đang tải dữ liệu chi tiết...</div>;
  if (!session) return <div className="p-10 text-center">Không tìm thấy phiên kiểm kê.</div>;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* HEADER & BACK BUTTON */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Phiên: {session.code} 
            <Badge variant="outline" className="text-lg">{session.status}</Badge>
          </h1>
          <p className="text-muted-foreground text-sm">
            Khu vực: {session.zoneCode} • Tổng SP: {session.totalItems} • Đã đếm: {session.countedItems}
          </p>
        </div>
      </div>

      {/* MAIN TABLE */}
      <Card className="shadow-sm border-t-4 border-t-blue-600">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Chi tiết Nhiệm vụ theo Kệ (Assignments)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-gray-100/80">
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Vị trí (Kệ)</TableHead>
                <TableHead>Trạng thái Kiểm</TableHead>
                <TableHead>Tổng SP</TableHead>
                <TableHead>Chênh lệch</TableHead>
                <TableHead className="text-right">Đánh giá</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedData.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center h-24">Chưa có dữ liệu sản phẩm</TableCell></TableRow>
              ) : (
                groupedData.map((group) => {
                  const isExpanded = expandedRows[group.locationCode];
                  
                  return (
                    <React.Fragment key={group.locationCode}>
                      {/* --- PARENT ROW (Assignment/Shelf) --- */}
                      <TableRow 
                        className={`cursor-pointer hover:bg-blue-50 transition-colors ${isExpanded ? "bg-blue-50/50" : ""}`}
                        onClick={() => toggleRow(group.locationCode)}
                      >
                        <TableCell>
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                        </TableCell>
                        <TableCell className="font-bold text-primary">{group.locationCode}</TableCell>
                        <TableCell>
                          {/* Logic hiển thị trạng thái từng kệ */}
                          {!group.isCounted ? (
                             <Badge variant="outline" className="text-gray-500 border-gray-300">Chưa đếm</Badge>
                          ) : group.hasDiscrepancy ? (
                             <Badge variant="secondary" className="bg-amber-100 text-amber-700 hover:bg-amber-200">Cảnh báo</Badge>
                          ) : (
                             <Badge variant="default" className="bg-green-600 hover:bg-green-700">Khớp 100%</Badge>
                          )}
                        </TableCell>
                        <TableCell>{group.items.length} items</TableCell>
                        <TableCell>
                          {group.hasDiscrepancy ? (
                            <span className="text-red-600 font-bold flex items-center gap-1">
                               {group.totalVariance} lỗi
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* ICON ĐÁNH GIÁ NHANH */}
                          <div className="flex justify-end">
                            {!group.isCounted ? (
                              <HelpCircle className="w-5 h-5 text-gray-300" />
                            ) : group.hasDiscrepancy ? (
                              <AlertTriangle className="w-5 h-5 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* --- CHILD ROW (Product Details) --- */}
                      {isExpanded && (
                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                          <TableCell colSpan={6} className="p-0 border-b">
                            <div className="p-4 pl-12 animate-in fade-in slide-in-from-top-1 duration-200">
                              <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
                                <Package className="w-4 h-4" /> Danh sách sản phẩm tại {group.locationCode}
                              </h4>
                              
                              <Table className="border rounded-md bg-white">
                                <TableHeader>
                                  <TableRow className="bg-gray-100 border-b">
                                    <TableHead className="h-9 text-xs">SKU</TableHead>
                                    <TableHead className="h-9 text-xs">Tên sản phẩm</TableHead>
                                    <TableHead className="h-9 text-xs text-right">Tồn hệ thống</TableHead>
                                    <TableHead className="h-9 text-xs text-right">Thực đếm</TableHead>
                                    <TableHead className="h-9 text-xs text-right">Chênh lệch</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {group.items.map((detail) => {
                                    // Tô màu dòng con nếu bị lệch
                                    const diff = (detail.actualCountedQty || 0) - detail.systemQtySnapshot;
                                    const hasError = detail.actualCountedQty !== undefined && diff !== 0;
                                    
                                    return (
                                      <TableRow key={detail.id} className={hasError ? "bg-red-50 hover:bg-red-100" : ""}>
                                        <TableCell className="font-mono text-xs">{detail.productSku}</TableCell>
                                        <TableCell className="text-sm">{detail.productName}</TableCell>
                                        <TableCell className="text-right font-medium">{detail.systemQtySnapshot}</TableCell>
                                        <TableCell className="text-right font-bold text-blue-700">
                                          {detail.actualCountedQty ?? <span className="text-gray-300">-</span>}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {hasError ? (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${diff > 0 ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                                              {diff > 0 ? `+${diff}` : diff}
                                            </span>
                                          ) : (
                                            <span className="text-green-600 text-xs font-bold">OK</span>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>

                              {group.items.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground text-sm italic">
                                  Chưa có thông tin sản phẩm chi tiết.
                                </div>
                              )}
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