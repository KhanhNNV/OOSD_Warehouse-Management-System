import { useState } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { outboundForStaffService } from "@/services/outboundForStaff.service";
import { useToast } from "@/components/ui/use-toast"; 

interface Props {
  orderId: number;
  orderNumber: string;
  onSuccess: () => void; 
}

export function RegisterOrderButton({ orderId, orderNumber, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [open, setOpen] = useState(false); 
  const handleRegister = async () => {
    try {
      setLoading(true);
      
      // Gọi Service
      const res = await outboundForStaffService.registerPicking(orderId);
      

      toast({
        title: "Thành công!",
        description: res.message, 
        variant: "default", 
        className: "bg-green-600 text-white border-none" 
      });

      setOpen(false);
      onSuccess();
      
    } catch (error) {

      toast({
        title: "Không thể nhận đơn",
        description: error.message, 
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <UserPlus className="h-4 w-4" />
          Nhận đơn
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Xác nhận nhận đơn hàng?</AlertDialogTitle>
          <AlertDialogDescription>
            Bạn có chắc chắn muốn đăng ký xử lý đơn hàng <b>{orderNumber}</b> không?
            <br />
            Hệ thống sẽ tạo phiếu xuất kho và gán trách nhiệm cho bạn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
                e.preventDefault(); 
                handleRegister();
            }} 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Đồng ý nhận việc
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}