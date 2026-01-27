import { useState, useMemo, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
    Table,
    TableHeader,
    TableBody,
    TableHead,
    TableRow,
    TableCell,
} from "@/components/ui/table";
import { AlertTriangle, Check, Loader2, Package, User, Edit2 } from "lucide-react";
import { VarianceReportResponse, VarianceItem } from "@/types/stocktake";

export interface AdjustmentItem {
    detailId: number;
    newQuantity: number;
}

interface VarianceReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: VarianceReportResponse | null;
    onApprove: (adjustments: AdjustmentItem[]) => Promise<void>;
    isApproving: boolean;
    canAdjust: boolean;
}

/**
 * Modal báo cáo sai lệch với khả năng chỉnh sửa số lượng từng sản phẩm.
 */
export default function VarianceReportModal({
    isOpen,
    onClose,
    report,
    onApprove,
    isApproving,
    canAdjust,
}: VarianceReportModalProps) {
    // State lưu các điều chỉnh của Manager: { detailId: newQuantity (string) }
    const [adjustments, setAdjustments] = useState<Record<number, string>>({});

    // Group items theo locationCode
    const groupedByLocation = useMemo(() => {
        if (!report?.variances) return {};
        return report.variances.reduce((acc, item) => {
            const key = item.locationCode;
            if (!acc[key]) acc[key] = [];
            acc[key].push(item);
            return acc;
        }, {} as Record<string, VarianceItem[]>);
    }, [report?.variances]);

    const locationCodes = Object.keys(groupedByLocation).sort();

    // Handler cập nhật số lượng
    const handleQuantityChange = useCallback((detailId: number, value: string) => {
        setAdjustments((prev) => {
            if (value === "") {
                // If value is empty, remove the entry from adjustments
                const { [detailId]: _, ...rest } = prev;
                return rest;
            } else if (/^\d+$/.test(value)) {
                // If value is a valid number string, update it
                return {
                    ...prev,
                    [detailId]: value,
                };
            }
            // If value is not empty and not a valid number string, do not update
            return prev;
        });
    }, []);

    // Lấy số lượng hiển thị (nếu đã sửa thì lấy từ adjustments, không thì lấy actualQty)
    const getDisplayQuantity = useCallback((item: VarianceItem) => {
        return adjustments[item.detailId] ?? item.actualQty.toString();
    }, [adjustments]);

    // Xử lý submit
    const handleSubmit = async () => {
        // Tạo danh sách adjustments từ state, loại bỏ các ô bị để trống (hoặc coi là 0)
        const adjustmentList: AdjustmentItem[] = Object.entries(adjustments)
            .filter(([_, qty]) => qty !== "") // Chỉ gửi những item có giá trị
            .map(([id, qty]) => ({
                detailId: Number(id),
                newQuantity: parseInt(qty, 10),
            }));
        await onApprove(adjustmentList);
    };

    // Reset state khi đóng modal
    const handleClose = () => {
        setAdjustments({});
        onClose();
    };

    if (!report) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Báo cáo sai lệch - {report.sessionCode}
                    </DialogTitle>
                    <DialogDescription>
                        {report.totalVarianceItems} sản phẩm sai lệch |{" "}
                        <span className="text-red-600 font-medium">Thiếu: {report.totalShortage}</span> |{" "}
                        <span className="text-blue-600 font-medium">Thừa: {report.totalOverage}</span>
                        {canAdjust && (
                            <span className="ml-2 text-orange-600">• Chỉnh sửa số lượng rồi bấm Xác nhận</span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                {/* Main content */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {locationCodes.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Không có sản phẩm sai lệch nào.
                        </div>
                    ) : (
                        locationCodes.map((locCode) => (
                            <LocationSection
                                key={locCode}
                                locationCode={locCode}
                                items={groupedByLocation[locCode]}
                                canAdjust={canAdjust}
                                adjustments={adjustments}
                                onQuantityChange={handleQuantityChange}
                                getDisplayQuantity={getDisplayQuantity}
                            />
                        ))
                    )}
                </div>

                <DialogFooter className="pt-4 border-t">
                    <Button variant="outline" onClick={handleClose}>
                        Đóng
                    </Button>
                    {canAdjust && (
                        <Button
                            onClick={handleSubmit}
                            disabled={isApproving}
                            className="bg-green-600 hover:bg-green-700 gap-2"
                        >
                            {isApproving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                            Xác nhận điều chỉnh tồn kho
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

/**
 * Section hiển thị sản phẩm sai lệch theo từng kệ
 */
function LocationSection({
    locationCode,
    items,
    canAdjust,
    adjustments,
    onQuantityChange,
    getDisplayQuantity,
}: {
    locationCode: string;
    items: VarianceItem[];
    canAdjust: boolean;
    adjustments: Record<number, string>;
    onQuantityChange: (detailId: number, value: string) => void;
    getDisplayQuantity: (item: VarianceItem) => string;
}) {
    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-gray-800">Kệ {locationCode}</span>
                </div>
                <Badge variant="destructive" className="text-xs">
                    {items.length} sản phẩm lệch
                </Badge>
            </div>

            <Table>
                <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                        <TableHead className="w-[50px]">Ảnh</TableHead>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="w-[100px]">Nhân viên</TableHead>
                        <TableHead className="text-right w-[80px]">Hệ thống</TableHead>
                        <TableHead className="text-right w-[80px]">Staff đếm</TableHead>
                        {canAdjust && <TableHead className="text-center w-[100px]">Số mới</TableHead>}
                        <TableHead className="text-right w-[80px]">Lệch</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => {
                        const isEdited = adjustments[item.detailId] !== undefined;
                        const displayQty = getDisplayQuantity(item);
                        const numQty = displayQty === "" ? item.actualQty : Number(displayQty);
                        const newVariance = numQty - item.systemQty;

                        return (
                            <TableRow key={item.detailId} className={isEdited ? "bg-yellow-50" : "hover:bg-red-50/30"}>
                                <TableCell>
                                    <Avatar className="h-9 w-9 rounded-md border">
                                        <AvatarImage src={item.productImage} className="object-cover" />
                                        <AvatarFallback className="text-xs">{item.productSku.slice(0, 2)}</AvatarFallback>
                                    </Avatar>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-900 text-sm">{item.productName}</span>
                                        <span className="text-xs text-gray-500 font-mono">{item.productSku}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {item.staffName ? (
                                        <div className="flex items-center gap-1 text-xs">
                                            <User className="w-3 h-3 text-gray-400" />
                                            <span>{item.staffName}</span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400 text-xs">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right font-medium text-gray-600">
                                    {item.systemQty}
                                </TableCell>
                                <TableCell className="text-right text-blue-700">
                                    {item.actualQty}
                                </TableCell>
                                {canAdjust && (
                                    <TableCell className="text-center">
                                        <Input
                                            type="number"
                                            min="0"
                                            className="w-20 h-8 text-center mx-auto"
                                            value={displayQty}
                                            onChange={(e) => onQuantityChange(item.detailId, e.target.value)}
                                        />
                                    </TableCell>
                                )}
                                <TableCell className="text-right">
                                    <span
                                        className={`font-bold px-2 py-0.5 rounded text-sm ${newVariance > 0
                                            ? "bg-blue-100 text-blue-700"
                                            : newVariance < 0
                                                ? "bg-red-100 text-red-700"
                                                : "bg-green-100 text-green-700"
                                            }`}
                                    >
                                        {newVariance > 0 ? `+${newVariance}` : newVariance === 0 ? "✓" : newVariance}
                                    </span>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
