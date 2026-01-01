package edu.uth.wms.controller;

import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.ZoneResponse;
import edu.uth.wms.service.IStructureService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/structure")
public class StructureController {

    @Autowired
    private IStructureService structureService;

    // 1. Lấy danh sách Khu vực
    @GetMapping("/zones")
    public ResponseEntity<List<ZoneResponse>> getZones() {
        return ResponseEntity.ok(structureService.getAllZones());
    }

    // 2. Lấy danh sách Kệ theo Khu vực
    @GetMapping("/zones/{zoneCode}/shelves")
    public ResponseEntity<List<String>> getShelves(@PathVariable String zoneCode) {
        return ResponseEntity.ok(structureService.getShelvesByZone(zoneCode));
    }

    // 3. Tạo Kệ mới
    @PostMapping("/shelves")
    public ResponseEntity<String> createShelf(@RequestBody ShelfCreateRequest request) {
        structureService.createShelf(request);
        return ResponseEntity.ok("Shelf created successfully with " + request.getTotalLevels() + " levels.");
    }

    // 4. Xóa Kệ
    @DeleteMapping("/shelves")
    public ResponseEntity<String> deleteShelf(@RequestParam String zone, @RequestParam String shelf) {
        structureService.deleteShelf(zone, shelf);
        return ResponseEntity.ok("Shelf " + shelf + " in Zone " + zone + " deleted.");
    }

    // Gợi ý vị trí trống
    // GET: /api/structure/shelves/available
    @GetMapping("/shelves/available")
    public ResponseEntity<List<String>> getAvailableShelves() {
        return ResponseEntity.ok(structureService.getAvailableShelves());
    }
}