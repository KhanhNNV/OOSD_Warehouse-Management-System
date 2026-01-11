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
 * THUẬT TOÁN FIFO - FIRST IN FIRST OUT
 * Xuất hàng nhập trước ra trước
 * 
 * LOGIC:
 * 1. Sắp xếp theo ngày sản xuất (manufacture_date) CŨ NHẤT lên đầu
 * 2. Nếu không có ngày sản xuất -> Xếp xuống cuối
 * 3. Nếu ngày sản xuất bằng nhau -> Sắp xếp theo ID (nhập trước vào DB thì ID nhỏ hơn)
 */
@Slf4j
@Component("fifoStrategy")
public class FifoPickingStrategy implements PickingStrategy {

    @Override
    public List<Inventory> suggestPickingOrder(
        Products product, 
        Integer requestedQty, 
        List<Inventory> allInventories
    ) {
        log.info("🔵 [FIFO] Bắt đầu sắp xếp kệ hàng cho sản phẩm: {} (SKU: {})", 
                 product.getName(), product.getSku());

        // ===============================================
        // BƯỚC 1: LỌC INVENTORY HỢP LỆ
        // ===============================================
        // Chỉ lấy những kệ:
        // - Còn hàng (quantity > 0)
        // - Không phải khu vực chờ (STAGE_LOC)
        // - Không phải khu vực tạm (TRANSIT)
        List<Inventory> validInventories = allInventories.stream()
            .filter(inv -> inv.getQuantity() > 0)
            .filter(inv -> inv.getLocation() != null)
            .filter(inv -> !"STAGE_LOC".equals(inv.getLocation().getLocationType().name()))
            .filter(inv -> !inv.getLocation().getCode().startsWith("TRANSIT_"))
            .collect(Collectors.toList());

        if (validInventories.isEmpty()) {
            log.warn("⚠️ [FIFO] Không tìm thấy kệ hợp lệ nào cho sản phẩm {}", product.getSku());
            return List.of();
        }

        // ===============================================
        // BƯỚC 2: SẮP XẾP THEO THUẬT TOÁN FIFO
        // ===============================================
        List<Inventory> sorted = validInventories.stream()
            .sorted(Comparator
                // Ưu tiên 1: Ngày sản xuất CŨ NHẤT lên đầu
                .comparing(
                    (Inventory inv) -> inv.getManufactureDate() != null 
                        ? inv.getManufactureDate() 
                        : LocalDate.MAX, // Nếu null -> đẩy xuống cuối
                    Comparator.naturalOrder() // Sắp xếp tăng dần (ngày cũ lên trước)
                )
                // Ưu tiên 2: Nếu ngày sản xuất bằng nhau -> Lấy ID nhỏ hơn (nhập trước)
                .thenComparing(Inventory::getId)
            )
            .collect(Collectors.toList());

        // ===============================================
        // BƯỚC 3: IN LOG ĐỂ DEBUG
        // ===============================================
        log.info("📋 [FIFO] Thứ tự ưu tiên lấy hàng:");
        sorted.forEach(inv -> 
            log.info("  - Kệ: {} | Tồn: {} | NSX: {} | ID: {}", 
                inv.getLocation().getCode(),
                inv.getQuantity(),
                inv.getManufactureDate(),
                inv.getId()
            )
        );

        return sorted;
    }

    @Override
    public String getAlgorithmName() {
        return "FIFO (First In First Out)";
    }
}