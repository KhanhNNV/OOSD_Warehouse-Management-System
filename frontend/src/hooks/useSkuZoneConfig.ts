import { useState, useEffect } from "react";
import { skuZoneConfigService } from "@/services/skuZoneConfig.service";
import { SkuZoneConfig, SkuZoneConfigRequest } from "@/types/skuZoneConfig";
import { useToast } from "@/hooks/use-toast";

export const useSkuZoneConfig = () => {
  const [configs, setConfigs] = useState<SkuZoneConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await skuZoneConfigService.getAll();
      setConfigs(data);
    } catch (error) {
      console.error("Failed to fetch configs", error);
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể tải danh sách cấu hình.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const createConfig = async (data: SkuZoneConfigRequest) => {
    try {
      await skuZoneConfigService.create(data);
      toast({
        title: "Thành công",
        description: "Đã tạo cấu hình mới.",
      });
      fetchConfigs();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Thất bại",
        description: error.response?.data?.message || "Không thể tạo cấu hình.",
      });
      return false;
    }
  };

  const updateConfig = async (id: number, data: SkuZoneConfigRequest) => {
    try {
      await skuZoneConfigService.update(id, data);
      toast({
        title: "Thành công",
        description: "Cập nhật cấu hình thành công.",
      });
      fetchConfigs();
      return true;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Thất bại",
        description: error.response?.data?.message || "Không thể cập nhật.",
      });
      return false;
    }
  };

  const deleteConfig = async (id: number) => {
    try {
      await skuZoneConfigService.delete(id);
      toast({
        title: "Đã xóa",
        description: "Cấu hình đã được xóa khỏi hệ thống.",
      });
      fetchConfigs();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Lỗi",
        description: "Không thể xóa cấu hình này.",
      });
    }
  };

  return {
    configs,
    loading,
    refresh: fetchConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
  };
};