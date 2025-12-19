import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StocktakeSession } from "@/types/wms";

interface CreateStocktakeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (session: Omit<StocktakeSession, "id" | "createdAt" | "updatedAt" | "totalItems" | "countedItems" | "varianceCount">) => void;
}

const zones = ["Zone A", "Zone B", "Zone C", "Zone D"];
const categories = ["Điện tử", "Thực phẩm", "Gia dụng", "Văn phòng phẩm", "Mỹ phẩm"];

export function CreateStocktakeDialog({
  open,
  onOpenChange,
  onSubmit,
}: CreateStocktakeDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"zone" | "category">("zone");
  const [zone, setZone] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"draft" | "open">("draft");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      type,
      zone: type === "zone" ? zone : undefined,
      category: type === "category" ? category : undefined,
      status,
      createdBy: "Nguyễn Văn A",
    });
    // Reset form
    setName("");
    setType("zone");
    setZone("");
    setCategory("");
    setStatus("draft");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo phiên kiểm kê mới</DialogTitle>
          <DialogDescription>
            Tạo phiên kiểm kê để bắt đầu đối chiếu hàng tồn kho thực tế với hệ thống.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Session Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Tên phiên kiểm kê *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Kiểm kê tuần 42 - Zone A"
              required
            />
          </div>

          {/* Type Selection */}
          <div className="space-y-3">
            <Label>Loại kiểm kê *</Label>
            <RadioGroup
              value={type}
              onValueChange={(value) => setType(value as "zone" | "category")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="zone" id="zone" />
                <Label htmlFor="zone" className="font-normal cursor-pointer">
                  Theo khu vực
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="category" id="category" />
                <Label htmlFor="category" className="font-normal cursor-pointer">
                  Theo danh mục
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Zone/Category Selection */}
          {type === "zone" ? (
            <div className="space-y-2">
              <Label htmlFor="zone-select">Chọn khu vực *</Label>
              <Select value={zone} onValueChange={setZone} required>
                <SelectTrigger id="zone-select">
                  <SelectValue placeholder="Chọn khu vực kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((z) => (
                    <SelectItem key={z} value={z}>
                      {z}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="category-select">Chọn danh mục *</Label>
              <Select value={category} onValueChange={setCategory} required>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Chọn danh mục kiểm kê" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Status */}
          <div className="space-y-3">
            <Label>Trạng thái ban đầu</Label>
            <RadioGroup
              value={status}
              onValueChange={(value) => setStatus(value as "draft" | "open")}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="draft" id="draft" />
                <Label htmlFor="draft" className="font-normal cursor-pointer">
                  Nháp (Draft)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="open" id="open" />
                <Label htmlFor="open" className="font-normal cursor-pointer">
                  Mở ngay (Open)
                </Label>
              </div>
            </RadioGroup>
            <p className="text-sm text-muted-foreground">
              Phiên "Nháp" chỉ lưu thông tin, phiên "Mở ngay" sẽ bắt đầu kiểm kê ngay lập tức.
            </p>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={!name || (type === "zone" ? !zone : !category)}>
              Tạo phiên
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
