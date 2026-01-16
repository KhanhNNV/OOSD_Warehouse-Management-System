package edu.uth.wms.service.strategy;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Products;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component("fefoStrategy")
public class FefoPickingStrategy implements PickingStrategy {

    @Override
    public List<Inventory> suggestPickingOrder(
            Products product,
            Integer requestedQty,
            List<Inventory> allInventories) {
        
        log.info("🟢 [FEFO] Tính toán cho sản phẩm: {} - Cần: {}", product.getSku(), requestedQty);

        // 1. Lọc Inventory hợp lệ VÀ tính sẵn lượng thực tế (Available > 0)
        List<Inventory> validInventories = allInventories.stream()
                .filter(inv -> inv.getLocation() != null)
                .filter(inv -> !"STAGE_LOC".equals(inv.getLocation().getLocationType().name()))
                .filter(inv -> !inv.getLocation().getCode().startsWith("TRANSIT_"))
                // QUAN TRỌNG: Dùng getAvailableQuantity() hoặc tính thủ công để đảm bảo chỉ lấy hàng chưa bị khóa
                .filter(inv -> (inv.getQuantity() - (inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated())) > 0)
                .collect(Collectors.toList());

        // 2. Kiểm tra tổng tồn kho khả dụng có đủ cho đơn hàng không
        long totalAvailable = validInventories.stream()
                .mapToLong(inv -> inv.getQuantity() - (inv.getQuantityAllocated() == null ? 0 : inv.getQuantityAllocated()))
                .sum();

        if (totalAvailable < requestedQty) {
            log.warn("⚠️ [FEFO] Không đủ hàng! Cần: {}, Có sẵn: {}", requestedQty, totalAvailable);
            return new ArrayList<>(); // Trả về rỗng nếu thiếu hàng
        }

        // 3. Sắp xếp theo FEFO (Hết hạn trước ra trước)
        List<Inventory> sorted = validInventories.stream()
                .sorted(Comparator
                        // Ưu tiên 1: Ngày hết hạn GẦN NHẤT lên đầu
                        .comparing(
                                (Inventory inv) -> inv.getExpiryDate() != null
                                        ? inv.getExpiryDate()
                                        : LocalDate.MAX, // Không có expiry -> đẩy xuống cuối
                                Comparator.naturalOrder()
                        )
                        // Ưu tiên 2: Nếu hết hạn cùng ngày -> Lấy hàng NSX CŨ hơn trước
                        .thenComparing(
                                inv -> inv.getManufactureDate() != null
                                        ? inv.getManufactureDate()
                                        : LocalDate.MAX,
                                Comparator.naturalOrder()
                        )
                        // Ưu tiên 3: ID nhỏ hơn (nhập trước)
                        .thenComparing(Inventory::getId)
                )
                .collect(Collectors.toList());

        return sorted;
    }

    @Override
    public String getAlgorithmName() {
        return "FEFO (First Expired First Out)";
    }


    @Override
    public List<Inventory> sortInventories(List<Inventory> inventories) {
        // CHỈ SẮP XẾP FEFO
        return inventories.stream()
                .sorted(Comparator
                        .comparing((Inventory inv) -> inv.getExpiryDate() != null ? inv.getExpiryDate() : LocalDate.MAX)
                        .thenComparing(inv -> inv.getManufactureDate() != null ? inv.getManufactureDate() : LocalDate.MAX)
                        .thenComparing(Inventory::getId)
                )
                .collect(Collectors.toList());
    }

    private boolean isValidInventory(Inventory inv) {
        return inv.getLocation() != null
                && !"STAGE_LOC".equals(inv.getLocation().getLocationType().name())
                && !inv.getLocation().getCode().startsWith("TRANSIT_");
    }
}