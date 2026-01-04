package edu.uth.wms.service;

import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.ZoneResponse;
import java.util.List;

public interface ILocationService {
    // Lấy danh sách khu vực
    List<ZoneResponse> getAllZones();

    // Lấy danh sách kệ trong khu vực
    List<String> getShelvesByZone(String zoneCode);

    // Lấy danh sách các vị trí kệ còn trống (để thực hiện Put-away)
    List<String> getAvailableShelves();

    // Lấy danh sách TOÀN BỘ mã vị trí (code) có trong hệ thống
    List<String> getAllLocationCodes();

    // Lấy kệ theo id
    String getLocationCodeById(Long id);

    // Tạo kệ (Thực chất là tạo loạt Location)
    void createShelf(ShelfCreateRequest request);

    //Xóa 1 vị trí cụ thể
    void deleteLocation(String code);

    // Xóa kệ (Xóa loạt Location)
    void deleteShelf(String zoneCode, String shelfCode);

    // Kiểm tra trạng thái đầy (is_full) theo ID ===
    Boolean isLocationFull(Long id);
}