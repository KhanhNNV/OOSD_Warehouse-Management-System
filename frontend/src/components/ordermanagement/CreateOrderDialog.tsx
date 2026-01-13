import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer, Product } from "@/types/outboundordermanagement";

interface CreateOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: Customer[];
  products: Product[];
  onSubmit: (data: any) => Promise<boolean>;
  isSubmitting: boolean;
}

interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  customers,
  products,
  onSubmit,
  isSubmitting,
}: CreateOrderDialogProps) {
  const [customerId, setCustomerId] = useState<string>("");
  const [toName, setToName] = useState("");
  const [toPhone, setToPhone] = useState("");
  const [toAddress, setToAddress] = useState("");
  
  const [items, setItems] = useState<OrderItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const resetForm = () => {
    setCustomerId("");
    setToName("");
    setToPhone("");
    setToAddress("");
    setItems([]);
    setSelectedProductId("");
    setQuantity(1);
  };

  const handleAddItem = () => {
    if (!selectedProductId || quantity <= 0) return;

    const product = products.find((p) => p.id === parseInt(selectedProductId));
    if (!product) return;

    const existingIndex = items.findIndex(
      (item) => item.productId === product.id
    );

    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += quantity;
      setItems(newItems);
    } else {
      setItems([
        ...items,
        {
          productId: product.id,
          productName: product.name,
          quantity: quantity,
        },
      ]);
    }

    setSelectedProductId("");
    setQuantity(1);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateQuantity = (index: number, newQty: number) => {
    if (newQty <= 0) return;
    const newItems = [...items];
    newItems[index].quantity = newQty;
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (!customerId || !toName || !toPhone || !toAddress || items.length === 0) {
      return;
    }

    const data = {
      customerId: parseInt(customerId),
      toName,
      toPhone,
      toAddress,
      items: items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    };

    const success = await onSubmit(data);
    if (success) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleCustomerChange = (value: string) => {
    setCustomerId(value);
    const customer = customers.find((c) => c.id === parseInt(value));
    if (customer) {
      setToName(customer.name);
      setToPhone(customer.phone);
      setToAddress(customer.address);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ FIXED: Thêm max-h và flex layout */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Tạo đơn xuất kho mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin đơn hàng và danh sách sản phẩm cần xuất
          </DialogDescription>
        </DialogHeader>

        {/* ✅ FIXED: Thêm overflow-y-auto */}
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="space-y-6 py-4">
            {/* Thông tin khách hàng */}
            <div className="space-y-4">
              <h3 className="font-semibold">Thông tin khách hàng</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer">Khách hàng *</Label>
                  <Select value={customerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger id="customer" className="mt-1">
                      <SelectValue placeholder="Chọn khách hàng" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(customers) && customers.length > 0 ? (
                        customers.map((customer) => (
                          <SelectItem
                            key={customer.id}
                            value={customer.id.toString()}
                          >
                            {customer.name} - {customer.phone}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-customers" disabled>
                          Không có khách hàng nào
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="toName">Tên người nhận *</Label>
                  <Input
                    id="toName"
                    value={toName}
                    onChange={(e) => setToName(e.target.value)}
                    placeholder="Nguyễn Văn A"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="toPhone">Số điện thoại *</Label>
                  <Input
                    id="toPhone"
                    value={toPhone}
                    onChange={(e) => setToPhone(e.target.value)}
                    placeholder="0901234567"
                    className="mt-1"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="toAddress">Địa chỉ giao hàng *</Label>
                  <Input
                    id="toAddress"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="123 Nguyễn Huệ, Quận 1, TP.HCM"
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Thêm sản phẩm */}
            <div className="space-y-4">
              <h3 className="font-semibold">Danh sách sản phẩm</h3>
              
              <div className="flex gap-2">
                <Select
                  value={selectedProductId}
                  onValueChange={setSelectedProductId}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Chọn sản phẩm" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(products) && products.length > 0 ? (
                      products.map((product) => (
                        <SelectItem
                          key={product.id}
                          value={product.id.toString()}
                        >
                          {product.name} ({product.sku})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-products" disabled>
                        Không có sản phẩm nào
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  placeholder="SL"
                  className="w-24"
                />

                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!selectedProductId}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm
                </Button>
              </div>

              {/* Table items */}
              {items.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="w-32">Số lượng</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateQuantity(
                                  index,
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="w-full"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  Chưa có sản phẩm nào
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ✅ FIXED: Footer cố định */}
        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !customerId ||
              !toName ||
              !toPhone ||
              !toAddress ||
              items.length === 0 ||
              isSubmitting
            }
          >
            {isSubmitting ? "Đang xử lý..." : "Tạo đơn hàng"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
