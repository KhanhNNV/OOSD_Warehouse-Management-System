import { useState } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useSkuZoneConfig } from "@/hooks/useSkuZoneConfig";
import { SkuZoneTable } from "@/components/sku-zone-config/SkuZoneTable";
import { SkuZoneDialog } from "@/components/sku-zone-config/SkuZoneDialog";
import { SkuZoneConfig, SkuZoneConfigRequest } from "@/types/skuZoneConfig";

export default function SkuZoneConfigPage() {
  const { configs, loading, createConfig, updateConfig, deleteConfig } =
    useSkuZoneConfig();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<SkuZoneConfig | null>(null);

  const handleCreate = () => {
    setEditingConfig(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (config: SkuZoneConfig) => {
    setEditingConfig(config);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: SkuZoneConfigRequest) => {
    if (editingConfig) {
      return await updateConfig(editingConfig.id, data);
    } else {
      return await createConfig(data);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-slate-50 min-h-screen">
      <div className="flex items-start justify-between">
        <div>
          <PageHeader
            title="Cấu hình Khu vực Lưu trữ"
            description="Định nghĩa quy tắc tự động gợi ý vị trí cất hàng dựa trên mã SKU."
          />
        </div>
        <Button onClick={handleCreate} className="mt-2">
          <Plus className="w-4 h-4 mr-2" /> Thêm cấu hình
        </Button>
      </div>

      <div className="flex items-center gap-2 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-100 text-sm">
        <Info className="w-5 h-5" />
        <p>
          Hệ thống sẽ dựa vào <strong>Ký tự đầu (Prefix)</strong> của mã sản phẩm để gợi ý vị trí. 
          Nếu Zone Chính đầy, hệ thống sẽ tự động tìm kiếm ở Zone Phụ.
        </p>
      </div>

      <SkuZoneTable
        data={configs}
        loading={loading}
        onEdit={handleEdit}
        onDelete={deleteConfig}
      />

      <SkuZoneDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        configToEdit={editingConfig}
        onSubmit={handleSubmit}
      />
    </div>
  );
}