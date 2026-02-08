import { useState, useEffect, useCallback } from "react";
import {
    Filter, RefreshCw, ArrowRight, ArrowLeft,
    FileText, Package, User, X, Calendar
} from "lucide-react";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Service & Types
import { transactionService } from "@/services/transaction.service";
import { InventoryTransaction } from "@/types/transaction";

// Enum Type mapping
const TRANSACTION_TYPES: Record<string, string> = {
    INBOUND_RECEIVE: "Nhập hàng (NCC)",
    INTERNAL_PICK: "Lấy hàng nội bộ",
    PUT_AWAY: "Cất hàng (Putaway)",
    OUTBOUND_PICK: "Lấy hàng xuất",
    STOCKTAKE_ADJUST: "Kiểm kê điều chỉnh",
    INBOUND_STAGE: "Nhập kho đệm",
    OUTBOUND_SHIP: "Xuất hàng đi"
};

export default function TransactionHistoryPage() {
    // --- STATE DỮ LIỆU ---
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    // --- STATE PHÂN TRANG ---
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // --- STATE BỘ LỌC ---
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterType, setFilterType] = useState<string>("ALL");

    // Các bộ lọc Text
    const [filterUser, setFilterUser] = useState("");
    const [filterDoc, setFilterDoc] = useState("");
    const [filterProduct, setFilterProduct] = useState("");

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                page: page,
                size: pageSize
            };

            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            if (filterType && filterType !== "ALL") params.type = filterType;

            if (filterDoc.trim()) params.referenceCode = filterDoc.trim();
            if (filterUser.trim()) params.performedBy = filterUser.trim();
            if (filterProduct.trim()) params.productKeyword = filterProduct.trim();


            const data = await transactionService.getAll(params);

            setTransactions(data.content || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, fromDate, toDate, filterType, filterUser, filterDoc, filterProduct]);

    // --- EFFECT ---

    // 1. Khi bộ lọc thay đổi -> Reset về trang 0 (Trang đầu tiên)
    useEffect(() => {
        setPage(0);
    }, [fromDate, toDate, filterType, filterUser, filterDoc, filterProduct]);

    // 2. Debounce Fetching: Gọi API khi page đổi hoặc sau khi ngừng gõ 500ms
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchTransactions();
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [fetchTransactions]);

    // --- UTILS ---
    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setFilterType("ALL");
        setFilterUser("");
        setFilterDoc("");
        setFilterProduct("");
        setPage(0);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
    const formatDateTime = (dateStr: string) => {
        if(!dateStr) return "-";
        return new Date(dateStr).toLocaleString('vi-VN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-screen animate-fade-in">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                        Lịch Sử Biến Động Kho
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Theo dõi chi tiết luồng hàng vào/ra, truy vết theo chứng từ và người thực hiện.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchTransactions} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* --- FILTER BAR --- */}
            <Card className="border-none shadow-sm bg-white">
                <CardHeader className="pb-3 border-b mb-3 py-4">
                    <div className="flex justify-between items-center">
                        <CardTitle className="text-sm font-bold uppercase text-slate-600 flex items-center gap-2">
                            <Filter className="w-4 h-4 text-blue-600" /> Bộ Lọc Tìm Kiếm
                        </CardTitle>

                        {(filterUser || filterDoc || filterProduct || filterType !== "ALL" || fromDate || toDate) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleReset}
                                className="h-8 text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                            >
                                <X className="w-3 h-3 mr-1" /> Xóa bộ lọc
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                        {/* 1. Mã chứng từ */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Mã chứng từ (Ref ID)</Label>
                            <div className="relative">
                                <FileText className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="PO-001..."
                                    className="pl-8 bg-slate-50/50 border-slate-200 focus:bg-white h-9 text-sm"
                                    value={filterDoc}
                                    onChange={(e) => setFilterDoc(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Sản phẩm */}
                        <div className="space-y-1.5 lg:col-span-2 xl:col-span-1">
                            <Label className="text-xs text-slate-500">Sản phẩm (SKU/Tên)</Label>
                            <div className="relative">
                                <Package className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Tìm tên hoặc mã..."
                                    className="pl-8 bg-slate-50/50 border-slate-200 focus:bg-white h-9 text-sm"
                                    value={filterProduct}
                                    onChange={(e) => setFilterProduct(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 3. Người thực hiện */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Người thực hiện</Label>
                            <div className="relative">
                                <User className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                                <Input
                                    placeholder="Tên nhân viên..."
                                    className="pl-8 bg-slate-50/50 border-slate-200 focus:bg-white h-9 text-sm"
                                    value={filterUser}
                                    onChange={(e) => setFilterUser(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 4. Loại giao dịch */}
                        <div className="space-y-1.5">
                            <Label className="text-xs text-slate-500">Loại giao dịch</Label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="bg-slate-50/50 border-slate-200 h-9 text-sm">
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả</SelectItem>
                                    {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 5. Khoảng thời gian (Gộp chung để tiết kiệm chỗ nếu cần, ở đây tách ra) */}
                        <div className="space-y-1.5 xl:col-span-2">
                            <Label className="text-xs text-slate-500">Khoảng thời gian</Label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="bg-slate-50/50 border-slate-200 h-9 text-sm px-2"
                                    />
                                </div>
                                <span className="text-slate-400">-</span>
                                <div className="relative flex-1">
                                    <Input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="bg-slate-50/50 border-slate-200 h-9 text-sm px-2"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </CardContent>
            </Card>

            {/* --- DATA TABLE --- */}
            <Card className="shadow-sm border border-slate-200 overflow-hidden bg-white">
                <div className="rounded-md">
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="w-[50px] font-bold text-slate-700">ID</TableHead>
                                <TableHead className="font-bold text-slate-700 w-[140px]">Thời Gian</TableHead>
                                <TableHead className="font-bold text-slate-700">Sản Phẩm</TableHead>
                                <TableHead className="font-bold text-slate-700">Loại GD</TableHead>
                                <TableHead className="font-bold text-slate-700">Chứng Từ</TableHead>
                                <TableHead className="text-right text-slate-500">Tồn Đầu</TableHead>
                                <TableHead className="text-right font-bold text-slate-700">Thay Đổi</TableHead>
                                <TableHead className="text-right font-bold text-blue-700">Tồn Cuối</TableHead>
                                <TableHead className="font-bold text-slate-700">Người Dùng</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-16 text-slate-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500"/>
                                            <span>Đang đồng bộ dữ liệu...</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-16 text-slate-500 italic bg-slate-50/30">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <Package className="w-10 h-10 text-slate-300" />
                                            <p>Không tìm thấy giao dịch nào phù hợp.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-blue-50/40 transition-colors border-b last:border-0">
                                        <TableCell className="font-mono text-xs text-slate-500">#{tx.id}</TableCell>
                                        <TableCell className="text-xs font-medium text-slate-700">
                                            {formatDateTime(tx.createdDate)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm text-slate-800 line-clamp-1" title={tx.productName}>
                                                {tx.productName}
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                                <Package className="w-3 h-3"/> {tx.productSku}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal bg-white whitespace-nowrap border-slate-200 text-slate-600 shadow-sm">
                                                {TRANSACTION_TYPES[tx.type] || tx.type}
                                            </Badge>
                                        </TableCell>

                                        {/* Cột Chứng từ */}
                                        <TableCell>
                                            {tx.referenceDocId ? (
                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 w-fit max-w-[150px]">
                                                    <FileText className="w-3 h-3 text-slate-400 shrink-0"/>
                                                    <span className="text-xs font-mono font-medium truncate" title={tx.referenceDocId}>
                                                        {tx.referenceDocId}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-slate-300 text-xs">-</span>
                                            )}
                                        </TableCell>

                                        {/* Số liệu kho */}
                                        <TableCell className="text-right text-slate-400 font-mono text-xs">
                                            {formatCurrency(tx.quantityBefore)}
                                        </TableCell>

                                        <TableCell className={`text-right font-bold font-mono text-sm ${tx.quantityChanged > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                            {tx.quantityChanged > 0 ? '+' : ''}{tx.quantityChanged}
                                        </TableCell>

                                        <TableCell className="text-right font-bold text-blue-700 font-mono text-sm bg-blue-50/30">
                                            {formatCurrency(tx.quantityAfter)}
                                        </TableCell>

                                        <TableCell className="text-sm">
                                            <div className="flex items-center gap-2 text-slate-700">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                                    <User className="w-3 h-3 text-slate-400"/>
                                                </div>
                                                <span className="text-xs font-medium truncate max-w-[100px]" title={tx.performedBy}>
                                                    {tx.performedBy || "System"}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* --- PAGINATION --- */}
                <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
                    <div className="text-xs text-slate-500">
                        Trang <strong>{page + 1}</strong> / <strong>{totalPages || 1}</strong>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0 || loading}
                        >
                            <ArrowLeft className="w-3 h-3 mr-1" /> Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 bg-white"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1 || loading}
                        >
                            Sau <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}