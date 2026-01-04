import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inboundService } from "@/services/inbound.service";
import { PurchaseOrder } from "@/types/inbound"; // Đảm bảo bạn đã có type này khớp với Backend DTO
import { format } from "date-fns"; // Cần cài date-fns hoặc dùng hàm format chuỗi đơn giản

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

// Icons
import { Search, Package, Calendar, Truck, ArrowRight, Filter, ChevronRight } from "lucide-react";

export default function InboundPage() {
    const navigate = useNavigate();
    const [pos, setPos] = useState<PurchaseOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");


    useEffect(() => {
        const fetchPOs = async () => {
            try {
                setIsLoading(true);
                const data = await inboundService.getPOs();
                const sortedData = data.sort((a, b) => (b.id || 0) - (a.id || 0));
                setPos(sortedData);
            } catch (error) {
                toast.error("Không thể tải danh sách phiếu nhập.");
                console.error(error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPOs();
    }, []);

    // 2. Xử lý tìm kiếm
    const filteredPos = pos.filter((po) =>
        po.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        po.supplierName.toLowerCase().includes(searchTerm.toLowerCase())
    );


    const handleStartScanning = (po: PurchaseOrder) => {

        navigate("/staff/scanning", { state: { poData: po } });
    };


    const renderStatusBadge = (status: string) => {
        switch (status) {
            case "NEW":
                return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200">Mới tạo</Badge>;
            case "APPROVED":
                return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200">Đã duyệt</Badge>;
            case "REJECTED":
                return <Badge variant="destructive">Đã từ chối</Badge>;
            case "COMPLETED":
                return <Badge variant="secondary" className="bg-slate-200 text-slate-700">Hoàn thành</Badge>;
            default:
                return <Badge variant="outline">Tiếp nhận</Badge>;
        }
    };

    return (
        <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto bg-slate-50/50 min-h-screen">
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Danh sách phiếu nhập</h1>
                    <p className="text-slate-500 text-sm mt-1">Chọn phiếu nhập "Đã duyệt" để tiến hành quét mã.</p>
                </div>
                
                {/* Search Bar */}
                <div className="flex w-full md:w-auto gap-2">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Tìm theo số PO, NCC..."
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" className="shrink-0">
                        <Filter className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* --- CONTENT --- */}
            {isLoading ? (

                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                </div>
            ) : filteredPos.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-dashed">
                    <Package className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                    <h3 className="text-lg font-medium text-slate-900">Không tìm thấy phiếu nhập nào</h3>
                    <p className="text-slate-500 text-sm">Vui lòng kiểm tra lại bộ lọc hoặc liên hệ quản lý.</p>
                </div>
            ) : (
                <>
                    {/* --- DESKTOP VIEW (Table) --- */}
                    <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[150px]">Số PO</TableHead>
                                    <TableHead>Nhà cung cấp</TableHead>
                                    <TableHead>Ngày dự kiến</TableHead>
                                    <TableHead>Trạng thái</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPos.map((po) => (
                                    <TableRow key={po.id} className="hover:bg-slate-50 transition-colors">
                                        <TableCell className="font-semibold text-blue-600">
                                            {po.poNumber}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-slate-400" />
                                                <span className="font-medium text-slate-700">{po.supplierName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-slate-500">
                                                <Calendar className="h-4 w-4" />
                    
                                                <span>{po.expectedDate}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{renderStatusBadge(po.status)}</TableCell>
                                        <TableCell className="text-center">
                                            {po.status === 'APPROVED' ? (
                                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => handleStartScanning(po)}>
                                                    Nhập hàng <ArrowRight className="ml-2 h-3 w-3" />
                                                </Button>
                                            ) : (
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[10px] uppercase text-slate-400">Người thực hiện:</span>
                                                    <span className="text-sm font-medium text-slate-600">
                                                        {/* Thay 'performerName' bằng tên trường thực tế từ Backend của bạn */}
                                                        {"Dương Thuận Buồm Xuôi Gio"}
                                                    </span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* --- MOBILE VIEW (Cards) --- */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredPos.map((po) => (
                            <Card key={po.id} className="shadow-sm border-slate-200 active:border-blue-400 transition-all">
                                <CardHeader className="p-4 pb-2 flex flex-row justify-between items-start space-y-0">
                                    <div>
                                        <CardTitle className="text-base font-bold text-blue-600 flex items-center gap-2">
                                            {po.poNumber}
                                        </CardTitle>
                                        <span className="text-xs text-slate-400 font-normal flex items-center gap-1 mt-1">
                                            <Calendar className="h-3 w-3" /> {po.expectedDate}
                                        </span>
                                    </div>
                                    {renderStatusBadge(po.status)}
                                </CardHeader>
                                <CardContent className="p-4 pt-2 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-slate-100 p-2 rounded-full">
                                            <Truck className="h-5 w-5 text-slate-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-medium uppercase">Nhà cung cấp</p>
                                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{po.supplierName}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
                                        <div>
                                            <p className="text-xs text-slate-500">Người thực hiện:</p>
                                            <p className="font-bold text-slate-800">Dương Thuận Thông</p>
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-0">
                                    {po.status === 'APPROVED' ? (
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-base" onClick={() => handleStartScanning(po)}>
                                            <Package className="mr-2 h-4 w-4" /> Bắt đầu quét
                                        </Button>
                                    ) : (
                                        <Button variant="secondary" className="w-full" disabled>
                                            Chưa sẵn sàng
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}