package edu.uth.wms.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import edu.uth.wms.dto.response.LocationShortResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import edu.uth.wms.dto.request.LocationVerifyRequest;
import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.LocationResponse;
import edu.uth.wms.dto.response.VerifyResponse;
import edu.uth.wms.dto.response.ZoneResponse;
import edu.uth.wms.model.Inventory;
import edu.uth.wms.service.ILocationService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/location")
@RequiredArgsConstructor
public class LocationController {

    @Autowired
    private ILocationService LocationService;
    // Inject thêm Repo này để query nhanh số lượng
    @Autowired
    private edu.uth.wms.repository.IInventoryRepository inventoryRepository;

    // API lấy tất cả các mã vị trí (code)
    @GetMapping("/codes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<LocationShortResponse>> getAllLocationCodes() {
        List<LocationShortResponse> codes = LocationService.getAllLocationCodes();
        return ResponseEntity.ok(codes);
    }

    // 1. Lấy danh sách Khu vực
    @GetMapping("/zones")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<ZoneResponse>> getZones() {
        return ResponseEntity.ok(LocationService.getAllZones());
    }

    // 2. Lấy danh sách Kệ theo Khu vực
    @GetMapping("/zones/{zoneCode}/shelves")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<String>> getShelves(@PathVariable String zoneCode) {
        return ResponseEntity.ok(LocationService.getShelvesByZone(zoneCode));
    }

    // 3. Tạo Kệ mới
    @PostMapping("/shelves")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> createShelf(@RequestBody ShelfCreateRequest request) {
        LocationService.createShelf(request);
        return ResponseEntity.ok("Shelf created successfully with " + request.getTotalLevels() + " levels.");
    }

    // 4. Xóa Kệ
    @DeleteMapping("/shelves")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteShelf(@RequestParam String zone, @RequestParam String shelf) {
        LocationService.deleteShelf(zone, shelf);
        return ResponseEntity.ok("Shelf " + shelf + " in Zone " + zone + " deleted.");
    }

    // DELETE /api/location?code=A-S01-01
    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteLocation(@RequestParam("code") String code) {
        LocationService.deleteLocation(code);
        return ResponseEntity.ok("Đã xóa vị trí: " + code);
    }

    // Gợi ý vị trí trống
    // GET: /api/Location/shelves/available
    @GetMapping("/shelves/available")
    @PreAuthorize("hasAnyRole('ADMIN','STAFF')")
    public ResponseEntity<List<String>> getAvailableShelves() {
        return ResponseEntity.ok(LocationService.getAvailableShelves());
    }

    // Lấy mã Code theo ID ===
    // GET /api/locations/{id}/code
    @GetMapping("/{id}/code")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> getLocationCode(@PathVariable Long id) {
        String code = LocationService.getLocationCodeById(id);
        return ResponseEntity.ok(Collections.singletonMap("code", code));
    }

    // Lấy trạng thái is_full theo ID ===
    // GET /api/locations/{id}/status
    @GetMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> getLocationStatus(@PathVariable Long id) {
        Boolean isFull = LocationService.isLocationFull(id);
        return ResponseEntity.ok(Collections.singletonMap("is_full", isFull));
    }

    @GetMapping("/code/{code}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<LocationResponse> getLocationByCode(@PathVariable String code) {
        return ResponseEntity.ok(LocationService.getLocationByCode(code));
    }

    @GetMapping("/type/{type}")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<List<LocationResponse>> getLocationsByType(@PathVariable String type) {
        return ResponseEntity.ok(LocationService.getLocationsByType(type));
    }

    @PostMapping("/verify")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<VerifyResponse> verifyProduct(@RequestBody LocationVerifyRequest request) {
        return ResponseEntity.ok(LocationService.verifyLocationMatch(request));
    }

    /**
     * GET /api/locations/suggestions?sku=SKU-DO1
     */
    @GetMapping("/suggestions")
    public ResponseEntity<List<String>> getSuggestedShelves(@RequestParam("sku") String sku) {

        List<String> suggestions = LocationService.getSuggestedShelvesForSku(sku);
        return ResponseEntity.ok(suggestions);
    }

    /**
     * Kiểm tra kệ có đầy không
     */
    @GetMapping("/{id}/is-full")
    public ResponseEntity<Boolean> checkLocationFull(@PathVariable Long id) {
        Boolean isFull = LocationService.isLocationFull(id);
        return ResponseEntity.ok(isFull);
    }

    // GET /api/location/suggest?sku=DO15
    @GetMapping("/suggest")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN','MANAGER')")
    public ResponseEntity<Map<String, String>> suggestLocation(@RequestParam String sku) {
        String suggestedLocation = LocationService.getSuggestedLocation(sku);
        return ResponseEntity.ok(Collections.singletonMap("suggestedLocation", suggestedLocation));
    }

    /**
     * API lấy trạng thái màu sắc cho danh sách kệ trong 1 Zone
     * Logic: Loop qua các kệ, tính tổng tồn kho -> Trả về Map
     */
    @GetMapping("/zones/{zoneCode}/shelf-stats")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Integer>> getShelfStats(@PathVariable String zoneCode) {
        // 1. Lấy danh sách mã kệ (VD: 01, 02, 03)
        List<String> shelves = LocationService.getShelvesByZone(zoneCode);

        Map<String, Integer> stats = new java.util.HashMap<>();

        for (String shelf : shelves) {
            // Mã location đầy đủ prefix: Zone-Shelf- (VD: A-01-)
            String prefix = zoneCode + "-" + shelf + "-";

            // Query DB tính tổng
            Integer totalQty = inventoryRepository.sumQuantityByLocationPrefix(prefix);
            stats.put(shelf, totalQty == null ? 0 : totalQty);
        }

        return ResponseEntity.ok(stats);
    }

    /**
     * Lấy chi tiết hàng hóa trong 1 Kệ (Khi user click vào ô màu)
     */
    @GetMapping("/zones/{zoneCode}/shelves/{shelfCode}/inventory")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<List<Inventory>> getShelfInventory(
            @PathVariable String zoneCode,
            @PathVariable String shelfCode) {

        String prefix;
        // [SỬA] Nếu là STAGE thì prefix chính là "STAGE" (không có dấu gạch nối)
        if ("STAGE".equalsIgnoreCase(zoneCode)) {
            prefix = "STAGE";
        } else {
            // Các kệ thường: Zone-Shelf- (VD: A-01-)
            prefix = zoneCode + "-" + shelfCode + "-";
        }

        return ResponseEntity.ok(inventoryRepository.findByLocationCodeStartingWith(prefix));
    }

}