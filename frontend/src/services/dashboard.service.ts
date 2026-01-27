import api from "@/services/api";
import { masterService } from "@/services/master.service";
import { putawayService } from "@/services/putAway.service";
import { RecentActivity } from "@/types/dashboard";

export const dashboardService = {
  /**
   * Lấy tất cả metrics cần thiết bằng cách gọi song song các API
   */
  async getDashboardData() {
    try {
      // ✅ Gọi song song tất cả APIs
      const [
        products,
        categories,
        suppliers,
        transit,
        availableShelves,
        inboundNotes,
        outboundNotes,
      ] = await Promise.all([
        api.get("/api/products").catch(() => ({ data: [] })),
        api.get("/api/categories").catch(() => ({ data: [] })),
        api.get("/api/suppliers").catch(() => ({ data: [] })),
        putawayService.getTransitInventory().catch(() => []),
        putawayService.getAvailableShelves().catch(() => []),
        api.get("/api/inbound-notes").catch(() => ({ data: [] })),
        api.get("/api/outbound-notes").catch(() => ({ data: [] })),
      ]);

      // ✅ Xử lý data
      const productList = products.data || [];
      const inboundList = inboundNotes.data || [];
      const outboundList = outboundNotes.data || [];

      // Tính toán metrics
      const today = new Date().toISOString().split("T")[0];

      return {
        stats: {
          totalProducts: productList.length,
          pendingPutAway: transit.length || 0,
          availableShelves: availableShelves.length || 0,
          totalCategories: (categories.data || []).length,
          lowStockCount: this.calculateLowStock(productList),
          todayInbound: this.filterToday(inboundList, today).length,
          todayOutbound: this.filterToday(outboundList, today).length,
        },
        recentActivities: this.buildRecentActivities(
          inboundList,
          outboundList,
          transit,
        ),
        transitItems: transit,
        topProducts: this.getTopProducts(productList),
      };
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      throw error;
    }
  },

  /**
   * Tính số sản phẩm sắp hết hàng (quantity < 10)
   */
  calculateLowStock(products: any[]): number {
    return products.filter((p) => {
      const qty = p.quantity || p.stockQuantity || 0;
      return qty > 0 && qty < 10;
    }).length;
  },

  /**
   * Filter items created today
   */
  filterToday(items: any[], today: string): any[] {
    return items.filter((item) => {
      const itemDate = new Date(item.createdAt || item.created_at)
        .toISOString()
        .split("T")[0];
      return itemDate === today;
    });
  },

  /**
   * Build recent activities từ nhiều nguồn
   */
  buildRecentActivities(
    inboundList: any[],
    outboundList: any[],
    transitList: any[],
  ): RecentActivity[] {
    const activities: RecentActivity[] = [];

    // Inbound activities (latest 3)
    inboundList.slice(0, 3).forEach((note) => {
      activities.push({
        id: `inbound-${note.id}`,
        type: "inbound",
        description: `Nhập kho: ${note.inboundCode || note.code}`,
        timestamp: note.createdAt || note.created_at,
        user: note.createdBy || "System",
      });
    });

    // Outbound activities (latest 3)
    outboundList.slice(0, 3).forEach((note) => {
      activities.push({
        id: `outbound-${note.id}`,
        type: "outbound",
        description: `Xuất kho: ${note.outboundCode || note.code}`,
        timestamp: note.createdAt || note.created_at,
        user: note.createdBy || "System",
      });
    });

    // Transit activities
    if (transitList.length > 0) {
      activities.push({
        id: "transit-pending",
        type: "transit",
        description: `${transitList.length} sản phẩm chờ cất hàng`,
        timestamp: new Date().toISOString(),
      });
    }

    // Sort by timestamp (newest first)
    return activities
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      .slice(0, 10);
  },

  /**
   * Get top products (based on quantity)
   */
  getTopProducts(products: any[]) {
    return products
      .map((p) => ({
        sku: p.sku,
        name: p.name,
        quantity: p.quantity || p.stockQuantity || 0,
        imageUrl: p.image_url,
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  },
};
