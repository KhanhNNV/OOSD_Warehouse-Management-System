import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";

export const useDashboard = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashboardService.getDashboardData(),
    refetchInterval: 60000, // Refresh mỗi 1 phút
    staleTime: 30000, // Consider data fresh for 30s
  });
};
