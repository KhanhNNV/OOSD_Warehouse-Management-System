import { useState, useEffect } from "react";
import {
    Search, Filter, Calendar, RefreshCw, ArrowRight, ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

// Components UI
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Service & Types
import { transactionService } from "@/services/transaction.service";
import { InventoryTransaction } from "@/types/transaction";

// Enum Type mapping cho đẹp
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
    // State dữ liệu
    const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
    const [loading, setLoading] = useState(false);

    // State phân trang
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // State bộ lọc
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterType, setFilterType] = useState<string>("ALL");

    // Hàm gọi API
    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params: any = { page, size: pageSize };
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;
            if (filterType && filterType !== "ALL") params.type = filterType;

            const data = await transactionService.getAll(params);
            setTransactions(data.content);
            setTotalPages(data.totalPages);
        } catch (error) {
            console.error("Lỗi tải lịch sử:", error);
        } finally {
            setLoading(false);
        }
    };

    // Effect: Gọi lại khi filter hoặc page thay đổi
    useEffect(() => {
        fetchTransactions();
    }, [page, filterType, fromDate, toDate]);

    // Hàm reset lọc
    const handleReset = () => {
        setFromDate("");
        setToDate("");
        setFilterType("ALL");
        setPage(0);
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('vi-VN').format(val);
    const formatDateTime = (dateStr: string) => new Date(dateStr).toLocaleString('vi-VN');

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            {/* --- HEADER --- */}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-blue-800 tracking-tight">
                    📜 Lịch Sử Biến Động Kho
                </h1>
                <Button variant="outline" size="sm" onClick={fetchTransactions}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </Button>
            </div>

            {/* --- FILTER BAR (Giống Manager Outbound) --- */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium uppercase text-gray-500 flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Bộ Lọc Tìm Kiếm
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        {/* 1. Từ ngày */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Từ ngày</label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                            />
                        </div>

                        {/* 2. Đến ngày */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Đến ngày</label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                            />
                        </div>

                        {/* 3. Loại giao dịch */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Loại Giao Dịch</label>
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tất cả" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">Tất cả giao dịch</SelectItem>
                                    {Object.entries(TRANSACTION_TYPES).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* 4. Nút Reset */}
                        <Button variant="ghost" onClick={handleReset} className="mb-[2px]">
                            Xóa lọc
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* --- DATA TABLE --- */}
            {/* --- DATA TABLE --- */}
            <Card className="shadow-sm border-t-4 border-t-blue-600">
                <div className="rounded-md border">
                    <Table>
                        <TableHeader className="bg-gray-100">
                            <TableRow>
                                <TableHead className="w-[50px]">ID</TableHead>
                                <TableHead>Thời Gian</TableHead>
                                <TableHead>Sản Phẩm</TableHead>
                                <TableHead>Loại Giao Dịch</TableHead>

                                {/* 👇 3 CỘT HEADER */}
                                <TableHead className="text-right text-gray-500">Tồn Trước</TableHead>
                                <TableHead className="text-right font-bold">Biến Động</TableHead>
                                <TableHead className="text-right text-blue-700">Tồn Sau</TableHead>

                                <TableHead>Chứng Từ (Ref)</TableHead>
                                <TableHead>Vị Trí</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                                        Đang tải dữ liệu...
                                    </TableCell>
                                </TableRow>
                            ) : transactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="text-center py-8 text-gray-500 italic">
                                        Không tìm thấy giao dịch nào phù hợp
                                    </TableCell>
                                </TableRow>
                            ) : (
                                transactions.map((tx) => (
                                    <TableRow key={tx.id} className="hover:bg-gray-50">
                                        <TableCell className="font-mono text-xs text-gray-500">#{tx.id}</TableCell>
                                        <TableCell className="text-sm">
                                            <div className="font-medium text-gray-700">{formatDateTime(tx.createdDate)}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{tx.productName}</div>
                                            <div className="text-xs text-gray-400">{tx.productSku}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="font-normal bg-white whitespace-nowrap">
                                                {TRANSACTION_TYPES[tx.type] || tx.type}
                                            </Badge>
                                        </TableCell>

                                        {/* 👇 3 CỘT BODY ĐƯỢC CHỈNH LẠI */}

                                        {/* 1. Tồn Trước (Màu xám) */}
                                        <TableCell className="text-right text-gray-500 font-mono">
                                            {formatCurrency(tx.quantityBefore)}
                                        </TableCell>

                                        {/* 2. Biến Động (Xanh/Đỏ) */}
                                        <TableCell className={`text-right font-bold font-mono ${tx.quantityChanged > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {tx.quantityChanged > 0 ? '+' : ''}{tx.quantityChanged}
                                        </TableCell>

                                        {/* 3. Tồn Sau (Màu xanh đậm) */}
                                        <TableCell className="text-right font-bold text-blue-700 font-mono bg-blue-50/30">
                                            {formatCurrency(tx.quantityAfter)}
                                        </TableCell>

                                        {/* 👆 KẾT THÚC CHỈNH SỬA */}

                                        <TableCell>
                                            <Badge variant="secondary" className="text-xs">
                                                {tx.referenceDocId || "-"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm">{tx.locationCode}</TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* --- PAGINATION (Phân trang giống mẫu) --- */}
                <div className="flex items-center justify-between px-4 py-4 border-t bg-gray-50">
                    <div className="text-xs text-gray-500">
                        Trang <strong>{page + 1}</strong> / {totalPages || 1}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={page === 0}
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" /> Trước
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={page >= totalPages - 1}
                        >
                            Sau <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}