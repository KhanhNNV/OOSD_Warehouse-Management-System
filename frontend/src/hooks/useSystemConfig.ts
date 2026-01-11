import { useState, useEffect } from "react";
import { systemConfigService } from "@/services/outbound.service";
import { SystemConfig } from "@/types/outbound";
import { useToast } from "./use-toast";

export function useSystemConfig() {
  const { toast } = useToast();
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch config
  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const data = await systemConfigService.getCurrentConfig();
      setConfig(data);
    } catch (error: any) {
      toast({
        title: "Lỗi kết nối",
        description: "Không thể tải cấu hình hệ thống",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Update algorithm
  const updateAlgorithm = async (algorithm: "FIFO" | "FEFO") => {
    setIsSaving(true);
    try {
      const updated = await systemConfigService.updateAlgorithm({ algorithm });
      setConfig(updated);
      
      toast({
        title: "Cập nhật thành công",
        description: `Thuật toán xuất kho đã được đổi thành ${algorithm}`,
        className: "bg-green-600 text-white border-none"
      });
    } catch (error: any) {
      toast({
        title: "Lỗi cập nhật",
        description: error.response?.data?.message || "Không thể cập nhật cấu hình",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    config,
    isLoading,
    isSaving,
    updateAlgorithm,
    refetch: fetchConfig
  };
}