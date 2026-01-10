import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { outboundService } from "@/services/outbound.service";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types/wms";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  products: Product[];
}

interface OrderItem {
  productId: number;
  productName: string;
  requestedQty: number;
}

export function CreateOrderDialog({ 
  open, 
  onOpenChange, 
  onSuccess,
  products 
}: CreateOrderDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    toName: "",
    toPhone: "",
    toAddress: ""
  });
  
  const [items, setItems] = useState<OrderItem[]>([]);

  const handleAddItem = () => {
    if (products.length === 0) {
      toast({
        title: "Chưa có sản phẩm",
        description: "Vui lòng thêm sản phẩm vào hệ thống trước",
        variant: "destructive"
      });
      return;
    }
    
    setItems([...items, { 
      productId: products[0].id, 
      productName: products[0].name,
      requestedQty: 1 
    }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

const handleItemChange = (index: number, field: keyof OrderItem, value: number | string) => {
  const newItems: OrderItem[] = [...items];
  
  if (field === "productId") {
    const product = products.find(p => p.id === parseInt(value as string));
    if (product) {
      newItems[index].productId = product.id;
      newItems[index].productName = product.name;
    }
  } else if (field === "requestedQty") {
    // Chuyển đổi sang number và đảm bảo >= 1
    const numValue = Math.max(1, parseInt(value as string) || 1);
    newItems[index].requestedQty = numValue;
  }
  // productName không cần xử lý vì nó được set tự động khi chọn productId
  
  setItems(newItems);
};

  const handleSubmit = async () => {
    // Validation
    if (!formData.toName || !formData.toPhone || !formData.toAddress) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin giao hàng",
        variant: "destructive"
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Chưa có sản phẩm",
        description: "Vui lòng thêm ít nhất 1 sản phẩm",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await outboundService.createOrder({
        ...formData,
        items: items.map(item => ({
          productId: item.productId,
          requestedQty: item.requestedQty
        }))
      });

      toast({
        title: "Tạo đơn thành công",
        description: "Đơn hàng đã được tạo và sẵn sàng xuất kho",
        className: "bg-green-600 text-white border-none"
      });

      // Reset form
      setFormData({ toName: "", toPhone: "", toAddress: "" });
      setItems([]);
      
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Lỗi tạo đơn",
        description: error.response?.data?.message || "Không thể tạo đơn hàng",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo đơn xuất kho mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Thông tin giao hàng */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-sm text-slate-700">Thông tin giao hàng</h4>
            
            <div className="space-y-2">
              <Label>Tên người nhận</Label>
              <Input
                value={formData.toName}
                onChange={e => setFormData({...formData, toName: e.target.value})}
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                value={formData.toPhone}
                onChange={e => setFormData({...formData, toPhone: e.target.value})}
                placeholder="0901234567"
              />
            </div>

            <div className="space-y-2">
              <Label>Địa chỉ giao hàng</Label>
              <Input
                value={formData.toAddress}
                onChange={e => setFormData({...formData, toAddress: e.target.value})}
                placeholder="123 Lê Lợi, Q1, TP.HCM"
              />
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-slate-700">Danh sách sản phẩm</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm sản phẩm
              </Button>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Package className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="text-sm">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-2 items-end p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label className="text-xs">Sản phẩm</Label>
                      <Select
                        value={item.productId.toString()}
                        onValueChange={(value) => handleItemChange(index, "productId", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(product => (
                            <SelectItem key={product.id} value={product.id.toString()}>
                              {product.name} ({product.sku})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-24 space-y-2">
                      <Label className="text-xs">Số lượng</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.requestedQty}
                        onChange={e => handleItemChange(index, "requestedQty", parseInt(e.target.value) || 1)}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Đang tạo..." : "Tạo đơn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}