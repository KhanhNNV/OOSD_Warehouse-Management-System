package edu.uth.wms.service.strategy;

import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Products;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * THUẬT TOÁN FEFO - FIRST EXPIRED FIRST OUT
 * Xuất hàng hết hạn trước ra trước
 * 
 * LOGIC:
 * 1. Sắp xếp theo ngày hết hạn (expiry_date) GẦN NHẤT lên đầu
 * 2. Nếu không có ngày hết hạn -> Xếp xuống cuối (vì không thể biết hết hạn khi nào)
 * 3. Nếu ngày hết hạn bằng nhau -> Sắp xếp theo ngày sản xuất (NSX cũ hơn lên trước)
 * 4. Nếu cả 2 đều bằng nhau -> Sắp xếp theo ID
 */
@Slf4j
@Component("fefoStrategy")
public class FefoPickingStrategy implements PickingStrategy {

    @Override
    public List<Inventory> suggestPickingOrder(
        Products product, 
        Integer requestedQty, 
        List<Inventory> allInventories
    ) {
        log.info("🟢 [FEFO] Bắt đầu sắp xếp kệ hàng cho sản phẩm: {} (SKU: {})", 
                 product.getName(), product.getSku());

        // ===============================================
        // BƯỚC 1: LỌC INVENTORY HỢP LỆ
        // ===============================================
        List<Inventory> validInventories = allInventories.stream()
            .filter(inv -> inv.getQuantity() > 0)
            .filter(inv -> inv.getLocation() != null)
            .filter(inv -> !"STAGE_LOC".equals(inv.getLocation().getLocationType().name()))
            .filter(inv -> !inv.getLocation().getCode().startsWith("TRANSIT_"))
            .collect(Collectors.toList());

        if (validInventories.isEmpty()) {
            log.warn("⚠️ [FEFO] Không tìm thấy kệ hợp lệ nào cho sản phẩm {}", product.getSku());
            return List.of();
        }

        // ===============================================
        // BƯỚC 2: SẮP XẾP THEO THUẬT TOÁN FEFO
        // ===============================================
        List<Inventory> sorted = validInventories.stream()
            .sorted(Comparator
                // Ưu tiên 1: Ngày hết hạn GẦN NHẤT lên đầu
                .comparing(
                    (Inventory inv) -> inv.getExpiryDate() != null 
                        ? inv.getExpiryDate() 
                        : LocalDate.MAX, // Không có expiry_date -> đẩy xuống cuối
                    Comparator.naturalOrder() // Sắp xếp tăng dần (ngày gần lên trước)
                )
                // Ưu tiên 2: Nếu hết hạn cùng ngày -> Lấy hàng sản xuất CŨ hơn trước
                .thenComparing(
                    inv -> inv.getManufactureDate() != null 
                        ? inv.getManufactureDate() 
                        : LocalDate.MAX,
                    Comparator.naturalOrder()
                )
                // Ưu tiên 3: Nếu tất cả đều bằng nhau -> Lấy ID nhỏ hơn
                .thenComparing(Inventory::getId)
            )
            .collect(Collectors.toList());

        // ===============================================
        // BƯỚC 3: IN LOG ĐỂ DEBUG
        // ===============================================
        log.info("📋 [FEFO] Thứ tự ưu tiên lấy hàng:");
        sorted.forEach(inv -> 
            log.info("  - Kệ: {} | Tồn: {} | HSD: {} | NSX: {} | ID: {}", 
                inv.getLocation().getCode(),
                inv.getQuantity(),
                inv.getExpiryDate(),
                inv.getManufactureDate(),
                inv.getId()
            )
        );

        return sorted;
    }

    @Override
    public String getAlgorithmName() {
        return "FEFO (First Expired First Out)";
    }
}