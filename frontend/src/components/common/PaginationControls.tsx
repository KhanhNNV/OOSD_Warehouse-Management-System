import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
}

export const PaginationControls = ({
                                       currentPage,
                                       totalPages,
                                       onPageChange,
                                       totalItems
                                   }: PaginationProps) => {
    if (totalPages <= 1) return null; // Ẩn nếu chỉ có 1 trang

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="text-sm text-muted-foreground">
                {totalItems ? `Tổng cộng ${totalItems} kết quả` : `Trang ${currentPage} / ${totalPages}`}
            </div>

            <div className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" /> Trước
                </Button>

                <div className="text-sm font-medium mx-2">
                    {currentPage} / {totalPages}
                </div>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    Sau <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
            </div>
        </div>
    );
};