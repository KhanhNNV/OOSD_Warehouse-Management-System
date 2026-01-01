package edu.uth.wms.controller;

import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.ZoneResponse;
import edu.uth.wms.service.ILocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/Location")
public class LocationController {

    @Autowired
    private ILocationService LocationService;

    // 1. Lấy danh sách Khu vực
    @GetMapping("/zones")
    public ResponseEntity<List<ZoneResponse>> getZones() {
        return ResponseEntity.ok(LocationService.getAllZones());
    }

    // 2. Lấy danh sách Kệ theo Khu vực
    @GetMapping("/zones/{zoneCode}/shelves")
    public ResponseEntity<List<String>> getShelves(@PathVariable String zoneCode) {
        return ResponseEntity.ok(LocationService.getShelvesByZone(zoneCode));
    }

    // 3. Tạo Kệ mới
    @PostMapping("/shelves")
    public ResponseEntity<String> createShelf(@RequestBody ShelfCreateRequest request) {
        LocationService.createShelf(request);
        return ResponseEntity.ok("Shelf created successfully with " + request.getTotalLevels() + " levels.");
    }

    // 4. Xóa Kệ
    @DeleteMapping("/shelves")
    public ResponseEntity<String> deleteShelf(@RequestParam String zone, @RequestParam String shelf) {
        LocationService.deleteShelf(zone, shelf);
        return ResponseEntity.ok("Shelf " + shelf + " in Zone " + zone + " deleted.");
    }

    // Gợi ý vị trí trống
    // GET: /api/Location/shelves/available
    @GetMapping("/shelves/available")
    public ResponseEntity<List<String>> getAvailableShelves() {
        return ResponseEntity.ok(LocationService.getAvailableShelves());
    }
}