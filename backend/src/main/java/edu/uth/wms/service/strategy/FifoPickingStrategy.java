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
@Component("fifoStrategy")
public class FifoPickingStrategy implements PickingStrategy {

    @Override
    public List<Inventory> suggestPickingOrder(
        Products product, 
        Integer requestedQty, 
        List<Inventory> allInventories
    ) {
        log.info("🔵 [FIFO] Tính toán cho sản phẩm: {} - Cần: {}", product.getSku(), requestedQty);

        // 1. Lọc Inventory hợp lệ VÀ tính sẵn lượng thực tế (Available = Quantity - Allocated)
        List<Inventory> validInventories = allInventories.stream()
            .filter(inv -> inv.getLocation() != null)
            .filter(inv -> !"STAGE_LOC".equals(inv.getLocation().getLocationType().name()))
            .filter(inv -> !inv.getLocation().getCode().startsWith("TRANSIT_"))
            .filter(inv -> (inv.getQuantity() - inv.getQuantityAllocated()) > 0) // QUAN TRỌNG: Chỉ lấy hàng chưa bị giữ
            .collect(Collectors.toList());

        // 2. Kiểm tra tổng tồn kho khả dụng
        long totalAvailable = validInventories.stream()
            .mapToLong(inv -> inv.getQuantity() - inv.getQuantityAllocated())
            .sum();

        if (totalAvailable < requestedQty) {
            log.warn("⚠️ [FIFO] Không đủ hàng! Cần: {}, Có sẵn: {}", requestedQty, totalAvailable);
            return new ArrayList<>(); // Trả về rỗng theo yêu cầu
        }

        // 3. Sắp xếp theo FIFO
        List<Inventory> sorted = validInventories.stream()
            .sorted(Comparator
                .comparing((Inventory inv) -> inv.getManufactureDate() != null ? inv.getManufactureDate() : LocalDate.MAX)
                .thenComparing(Inventory::getId)
            )
            .collect(Collectors.toList());

        // 4. Chọn các kệ cần thiết (Cắt danh sách)
        // Nếu kệ 1 có 5, kệ 2 có 10, cần 8 -> Lấy kệ 1 và một phần kệ 2.
        // Tuy nhiên, Strategy thường chỉ trả về danh sách ưu tiên. Việc cắt số lượng cụ thể nên để Service xử lý.
        // Nhưng để đảm bảo đúng logic "lấy tiếp sang các kho lân cận", danh sách sorted này là đủ.
        
        return sorted; 
    }

    @Override
    public String getAlgorithmName() {
        return "FIFO (First In First Out)";
    }

    @Override
    public List<Inventory> sortInventories(List<Inventory> inventories) {
        return inventories.stream()
                .sorted(Comparator
                        .comparing((Inventory inv) -> inv.getManufactureDate() != null ? inv.getManufactureDate() : LocalDate.MAX)
                        .thenComparing(Inventory::getId)
                )
                .collect(Collectors.toList());
    }

    // Hàm phụ để check điều kiện vị trí (tránh lặp code)
    private boolean isValidInventory(Inventory inv) {
        return inv.getLocation() != null
                && !"STAGE_LOC".equals(inv.getLocation().getLocationType().name())
                && !inv.getLocation().getCode().startsWith("TRANSIT_");
    }
}