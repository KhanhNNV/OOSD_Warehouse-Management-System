package edu.uth.wms.service;

import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.ZoneResponse;
import java.util.List;

public interface IStructureService {
    // Lấy danh sách khu vực
    List<ZoneResponse> getAllZones();
    
    // Lấy danh sách kệ trong khu vực
    List<String> getShelvesByZone(String zoneCode);
    
    // MỚI: Lấy danh sách các vị trí kệ còn trống (để thực hiện Put-away)
    List<String> getAvailableShelves();
    
    // Tạo kệ (Thực chất là tạo loạt Location)
    void createShelf(ShelfCreateRequest request);
    
    // Xóa kệ (Xóa loạt Location)
    void deleteShelf(String zoneCode, String shelfCode);
}