package edu.uth.wms.service;

import java.util.List;

import edu.uth.wms.dto.request.LocationVerifyRequest;
import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.LocationResponse;
import edu.uth.wms.dto.response.LocationShortResponse;
import edu.uth.wms.dto.response.VerifyResponse;
import edu.uth.wms.dto.response.ZoneResponse;

public interface ILocationService {
    // Lấy danh sách khu vực
    List<ZoneResponse> getAllZones();

    // Lấy danh sách kệ trong khu vực
    List<String> getShelvesByZone(String zoneCode);

    // Lấy danh sách các vị trí kệ còn trống (để thực hiện Put-away)
    List<String> getAvailableShelves();

    // Lấy danh sách TOÀN BỘ mã vị trí (code) có trong hệ thống
    List<LocationShortResponse> getAllLocationCodes();

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

    LocationResponse getLocationByCode(String code);


    List<LocationResponse> getLocationsByType(String type);

    // Method gợi ý kệ trống
    List<String> getSuggestedShelvesForSku(String sku);
    VerifyResponse verifyLocationMatch(LocationVerifyRequest request);

    //Gợi ý vị trí dựa trên SKU theo logic Waterfall (Primary Zone -> Backup Zone)
    String getSuggestedLocation(String sku);
}