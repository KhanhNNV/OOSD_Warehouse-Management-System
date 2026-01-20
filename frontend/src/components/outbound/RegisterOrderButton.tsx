import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { outboundService } from "@/services/outbound.service";

interface RegisterOrderButtonProps {
    orderId: number;
    orderNumber: string;
    onSuccess: () => void; // Callback để navigate sau khi thành công
}

export function RegisterOrderButton({ orderId, orderNumber, onSuccess }: RegisterOrderButtonProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleRegister = async () => {
        setLoading(true);
        try {
            await outboundService.registerPicking(orderId);
            toast({
                title: "Đã nhận đơn!",
                description: `Bắt đầu soạn hàng cho đơn ${orderNumber}`,
                className: "bg-green-600 text-white border-none",
            });
            // Gọi callback để chuyển trang
            onSuccess();
        } catch (error: any) {
            toast({
                title: "Không thể nhận đơn",
                description: error.response?.data?.message || "Có lỗi xảy ra",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
            onClick={handleRegister}
            disabled={loading}
        >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
            Nhận đơn
        </Button>
    );
}