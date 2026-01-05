// src/hooks/usePickingScanner.ts
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast"; // 1. Thay đổi import
import { pickingService } from "@/services/picking.service";
import { PickingItem, LocationResponse } from "@/types/picking";

const STORAGE_STAGE = "PICK_CURRENT_STAGE";
const STORAGE_ITEMS = "PICK_CART_ITEMS";

export const usePickingScanner = () => {
    // 2. Khởi tạo hook toast
    const { toast } = useToast();

    // State 1: Vị trí Stage hiện tại
    const [currentStage, setCurrentStage] = useState<LocationResponse | null>(() => {
        const saved = localStorage.getItem(STORAGE_STAGE);
        return saved ? JSON.parse(saved) : null;
    });

    // State 2: Danh sách hàng đã quét
    const [pickedItems, setPickedItems] = useState<PickingItem[]>(() => {
        const saved = localStorage.getItem(STORAGE_ITEMS);
        return saved ? JSON.parse(saved) : [];
    });

    // State 3: Modal nhập số lượng
    const [session, setSession] = useState<{
        mode: 'ADD' | 'EDIT' | null;
        item: PickingItem | null;
        index?: number;
    }>({ mode: null, item: null });

    const [isLoading, setIsLoading] = useState(false);

    // Tự động lưu LocalStorage
    useEffect(() => {
        if (currentStage) localStorage.setItem(STORAGE_STAGE, JSON.stringify(currentStage));
        else localStorage.removeItem(STORAGE_STAGE);
    }, [currentStage]);

    useEffect(() => {
        localStorage.setItem(STORAGE_ITEMS, JSON.stringify(pickedItems));
    }, [pickedItems]);

    // --- LOGIC QUÉT MÃ ---
    const handleScan = async (code: string) => {
        if (!code) return;
        const cleanCode = code.trim();
        setIsLoading(true);

        try {
            // BƯỚC 1: Kiểm tra xem có phải mã Vị trí (Stage) không?
            const location = await pickingService.getLocationByCode(cleanCode);

            if (location && location.locationType === 'STAGE_LOC') {
                // Nếu đang có hàng của Stage khác thì cảnh báo
                if (pickedItems.length > 0 && currentStage?.id !== location.id) {
                    // 3. Thay thế toast.error
                    toast({
                        title: "Lỗi thao tác",
                        description: "Vui lòng hoàn thành hoặc xóa danh sách hàng cũ trước khi đổi Stage!",
                        variant: "destructive",
                    });
                    setIsLoading(false);
                    return;
                }
                setCurrentStage(location);
                // 3. Thay thế toast.success
                toast({
                    title: "Đã chọn Stage",
                    description: `Vị trí: ${location.code}`,
                    className: "bg-green-600 text-white border-none" // Style tùy chọn cho đẹp
                });
                setIsLoading(false);
                return;
            }

            // BƯỚC 2: Nếu không phải vị trí -> Kiểm tra Sản phẩm
            if (!currentStage) {
                // 3. Thay thế toast.warning (dùng destructive hoặc default)
                toast({
                    title: "Chưa chọn Stage",
                    description: "Vui lòng quét mã vị trí STAGE trước khi quét hàng.",
                    variant: "destructive",
                });
                setIsLoading(false);
                return;
            }

            const product = await pickingService.getProductByBarcode(cleanCode);

            if (product) {
                const newItem: PickingItem = {
                    productId: product.productId,
                    productName: product.productName || product.name,
                    barcode: product.barcode,
                    sku: product.sku,
                    image: product.image,
                    inputQty: 1,
                    stageLocationId: currentStage.id,
                    stageLocationCode: currentStage.code
                };
                setSession({ mode: 'ADD', item: newItem });

                toast({
                    title: "Tìm thấy sản phẩm",
                    description: newItem.productName,
                });
            } else {
                toast({
                    title: "Không tìm thấy",
                    description: `Không có dữ liệu cho mã: ${cleanCode}`,
                    variant: "destructive",
                });
            }

        } catch (error) {
            console.error(error);
            toast({
                title: "Lỗi hệ thống",
                description: "Đã xảy ra lỗi khi xử lý mã quét.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // --- HÀM THÊM/SỬA SỐ LƯỢNG ---
    const confirmSession = (qty: number) => {
        if (!session.item || qty <= 0) return;
        const newList = [...pickedItems];

        if (session.mode === 'ADD') {
            const existIdx = newList.findIndex(i => i.productId === session.item!.productId);
            if (existIdx >= 0) {
                newList[existIdx].inputQty += qty;
                toast({
                    title: "Cập nhật",
                    description: `Đã cộng thêm +${qty} vào sản phẩm có sẵn.`,
                });
            } else {
                newList.unshift({ ...session.item, inputQty: qty });
                toast({
                    title: "Thêm mới",
                    description: "Đã thêm sản phẩm vào danh sách.",
                });
            }
        } else if (session.mode === 'EDIT' && session.index !== undefined) {
            newList[session.index].inputQty = qty;
            toast({
                title: "Cập nhật",
                description: "Đã thay đổi số lượng thành công.",
            });
        }

        setPickedItems(newList);
        setSession({ mode: null, item: null });
    };

    return {
        currentStage, setCurrentStage,
        pickedItems, setPickedItems,
        handleScan, isLoading,
        session, setSession, confirmSession
    };
};