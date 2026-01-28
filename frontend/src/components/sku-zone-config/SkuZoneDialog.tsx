import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SkuZoneConfig, SkuZoneConfigRequest } from "@/types/skuZoneConfig";
import { Loader2 } from "lucide-react";

interface SkuZoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  configToEdit?: SkuZoneConfig | null;
  onSubmit: (data: SkuZoneConfigRequest) => Promise<boolean>;
}

export function SkuZoneDialog({
  open,
  onOpenChange,
  configToEdit,
  onSubmit,
}: SkuZoneDialogProps) {
  const [formData, setFormData] = useState<SkuZoneConfigRequest>({
    skuPrefix: "",
    primaryZone: "",
    backupZone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (configToEdit) {
        setFormData({
          skuPrefix: configToEdit.skuPrefix,
          primaryZone: configToEdit.primaryZone,
          backupZone: configToEdit.backupZone || "",
        });
      } else {
        setFormData({ skuPrefix: "", primaryZone: "", backupZone: "" });
      }
    }
  }, [open, configToEdit]);

  const handleSubmit = async () => {
    if (!formData.skuPrefix || !formData.primaryZone) return; // Basic validation

    setIsSubmitting(true);
    const success = await onSubmit(formData);
    setIsSubmitting(false);

    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {configToEdit ? "Cập nhật Cấu hình" : "Thêm quy tắc mới"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="skuPrefix" className="text-right">
              Mã Prefix <span className="text-red-500">*</span>
            </Label>
            <Input
              id="skuPrefix"
              placeholder="VD: DO, VN"
              className="col-span-3 uppercase"
              value={formData.skuPrefix}
              onChange={(e) =>
                setFormData({ ...formData, skuPrefix: e.target.value.toUpperCase() })
              }
              disabled={!!configToEdit} // Không cho sửa Prefix khi edit để tránh conflict logic
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="primaryZone" className="text-right">
              Zone Chính <span className="text-red-500">*</span>
            </Label>
            <Input
              id="primaryZone"
              placeholder="VD: A"
              className="col-span-3 uppercase"
              value={formData.primaryZone}
              onChange={(e) =>
                setFormData({ ...formData, primaryZone: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="backupZone" className="text-right">
              Zone Phụ
            </Label>
            <Input
              id="backupZone"
              placeholder="VD: B (Tùy chọn)"
              className="col-span-3 uppercase"
              value={formData.backupZone || ""}
              onChange={(e) =>
                setFormData({ ...formData, backupZone: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {configToEdit ? "Lưu thay đổi" : "Tạo mới"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}