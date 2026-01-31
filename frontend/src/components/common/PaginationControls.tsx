import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import thêm Input
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";

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
    // State local để lưu giá trị người dùng đang gõ
    const [inputVal, setInputVal] = useState(currentPage.toString());

    // Khi currentPage từ props thay đổi (do bấm nút Prev/Next), cập nhật lại inputVal
    useEffect(() => {
        setInputVal(currentPage.toString());
    }, [currentPage]);

    if (totalPages <= 1) return null;

    // Xử lý khi người dùng nhập (chỉ cho phép số)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Chỉ cho phép nhập số
        if (value === "" || /^[0-9]+$/.test(value)) {
            setInputVal(value);
        }
    };

    // Xử lý logic nhảy trang
    const handleJumpPage = () => {
        const pageNumber = parseInt(inputVal);

        if (pageNumber >= 1 && pageNumber <= totalPages) {
            onPageChange(pageNumber);
        } else {
            // Nếu nhập sai (số quá lớn hoặc quá nhỏ), reset về trang hiện tại
            setInputVal(currentPage.toString());
        }
    };

    // Bắt sự kiện phím Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleJumpPage();
            // Blur input để bỏ focus sau khi enter (tùy chọn)
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-4 gap-4 sm:gap-0">
            {/* Hiển thị tổng số kết quả bên trái */}
            <div className="text-sm text-muted-foreground">
                {totalItems ? `Tổng cộng ${totalItems} kết quả` : `Trang ${currentPage} trên ${totalPages}`}
            </div>

            <div className="flex items-center space-x-2">
                {/* Nút Trước */}
                <Button
                    variant="outline"
                    size="icon" // Đổi thành size icon cho gọn
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Phần nhập trang: [Input] / [Total] */}
                <div className="flex items-center gap-2 mx-2">
                    <span className="text-sm font-medium hidden sm:inline-block">Trang</span>
                    <Input
                        className="h-8 w-14 text-center px-1" // Input nhỏ gọn
                        value={inputVal}
                        onChange={handleInputChange}
                        onBlur={handleJumpPage} // Nhảy trang khi click ra ngoài
                        onKeyDown={handleKeyDown} // Nhảy trang khi Enter
                    />
                    <span className="text-sm text-muted-foreground">/ {totalPages}</span>
                </div>

                {/* Nút Sau */}
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};