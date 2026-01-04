import { useState, useMemo, useEffect } from "react";

// T là kiểu dữ liệu tổng quát (Generic)
export const usePagination = <T>(data: T[], itemsPerPage: number = 10) => {
    const [currentPage, setCurrentPage] = useState(1);

    // Tính tổng số trang
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // Reset về trang 1 nếu dữ liệu đầu vào thay đổi (ví dụ: khi tìm kiếm/lọc)
    useEffect(() => {
        setCurrentPage(1);
    }, [data.length]);

    // Cắt dữ liệu cho trang hiện tại
    const currentData = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return data.slice(start, end);
    }, [data, currentPage, itemsPerPage]);

    // Các hàm điều khiển
    const goToPage = (page: number) => {
        const pageNumber = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(pageNumber);
    };

    const nextPage = () => goToPage(currentPage + 1);
    const prevPage = () => goToPage(currentPage - 1);

    return {
        currentData,   // Dữ liệu đã cắt cho trang này
        currentPage,   // Trang hiện tại
        totalPages,    // Tổng số trang
        goToPage,      // Hàm nhảy trang
        nextPage,      // Hàm trang sau
        prevPage,      // Hàm trang trước
        totalItems: data.length // Tổng số phần tử
    };
};