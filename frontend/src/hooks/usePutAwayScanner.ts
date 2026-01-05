import { useState } from "react";
import { toast } from "sonner";
import { productService } from "@/services/product.service";
import { putAwayService } from "@/services/putAway.service.ts";
import { ScannedItem, LocationResponse } from "@/types/putAway.ts";

export const usePutAwayScanner = () => {
    const [currentShelf, setCurrentShelf] = useState<LocationResponse | null>(null);
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // State cho Modal nhập liệu
    const [modalData, setModalData] = useState<{
        isOpen: boolean;
        product: ScannedItem | null;
        mode: 'ADD' | 'EDIT';
    }>({ isOpen: false, product: null, mode: 'ADD' });

    // Hàm xử lý chính khi quét 1 mã bất kỳ
    const handleScan = async (code: string) => {
        if (!code) return;
        setIsLoading(true);
        try {
            // 1. Thử tìm xem có phải là Location (Kệ) không?
            // Mẹo: Nếu quy tắc đặt tên kệ khác SP (vd: kệ bắt đầu bằng 'LOC-' hay 'SHELF-')
            // thì check string trước để đỡ gọi API thừa.
            // Ở đây mình gọi API Location trước.
            try {
                const location = await putAwayService.getLocationByCode(code);
                if (location) {
                    setCurrentShelf(location);
                    toast.success(`Đã chọn kệ: ${location.code}`);
                    setIsLoading(false);
                    return; // Dừng lại, đây là quét kệ
                }
            } catch (e) {
                // Không phải location, bỏ qua, chạy tiếp xuống dưới tìm Product
            }

            // 2. Nếu không phải kệ, tìm Sản phẩm
            // CHẶN: Nếu chưa chọn kệ thì cảnh báo (Tùy nghiệp vụ, ở đây bắt buộc chọn kệ trước)
            if (!currentShelf) {
                toast.warning("Vui lòng quét mã Kệ (Shelf) trước khi quét sản phẩm!");
                setIsLoading(false);
                return;
            }

            const product = await productService.getProductByBarcode(code);
            if (product) {
                // Mở modal nhập số lượng & Date
                setModalData({
                    isOpen: true,
                    mode: 'ADD',
                    product: {
                        ...product,
                        inputQty: 1,
                        targetShelfCode: currentShelf.code, // Gán kệ hiện tại
                        manufactureDate: '',
                        expiryDate: ''
                    }
                });
                toast.success(`Tìm thấy SP: ${product.productName}`);
            }

        } catch (error) {
            toast.error("Không tìm thấy Mã kệ hoặc Sản phẩm này");
        } finally {
            setIsLoading(false);
        }
    };

    const addItem = (item: ScannedItem) => {
        setScannedItems(prev => [item, ...prev]); // Thêm vào đầu list
        setModalData({ ...modalData, isOpen: false });
    };

    const removeItem = (index: number) => {
        setScannedItems(prev => prev.filter((_, i) => i !== index));
    };

    const clearAll = () => setScannedItems([]);

    return {
        currentShelf,
        setCurrentShelf, // Để có thể clear kệ nếu muốn chọn lại
        scannedItems,
        handleScan,
        isLoading,
        modalData,
        setModalData,
        addItem,
        removeItem,
        clearAll
    };
};