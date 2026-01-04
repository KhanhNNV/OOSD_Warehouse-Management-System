package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.ShelfCreateRequest;
import edu.uth.wms.dto.response.ZoneResponse;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.Locations;
import edu.uth.wms.repository.ILocationRepository;
import edu.uth.wms.service.ILocationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class LocationServiceImpl implements ILocationService {

    @Autowired
    private ILocationRepository locationRepository;

    @Override
    public List<ZoneResponse> getAllZones() {
        List<String> zones = locationRepository.findDistinctZones();
        return zones.stream().map(ZoneResponse::new).collect(Collectors.toList());
    }

    @Override
    public List<String> getShelvesByZone(String zoneCode) {
        return locationRepository.findDistinctShelvesByZone(zoneCode);
    }

    @Override
    @Transactional
    public void createShelf(ShelfCreateRequest request) {
        String zone = request.getZoneCode().toUpperCase();
        String shelf = request.getShelfCode().toUpperCase();

        for (int i = 1; i <= request.getTotalLevels(); i++) {
            String levelCode = String.format("%02d", i);
            String fullCode = zone + "-" + shelf + "-" + levelCode;

            if (!locationRepository.existsByCode(fullCode)) {
                Locations loc = Locations.builder()
                        .code(fullCode)
                        .locationType(LocationType.SHELF_STORAGE)
                        .isFull(false)
                        .build();

                locationRepository.save(loc);
            }
        }
    }

    @Override
    @Transactional
    public void deleteShelf(String zoneCode, String shelfCode) {
        String prefix = zoneCode + "-" + shelfCode + "-";

        // 1. Tìm tất cả các tầng (location) thuộc kệ này
        List<Locations> locationsToDelete = locationRepository.findByCodeStartingWith(prefix);

        if (locationsToDelete.isEmpty()) {
            throw new RuntimeException("Không tìm thấy kệ " + shelfCode + " trong khu vực " + zoneCode);
        }

        // 2. KIỂM TRA AN TOÀN (Logic mới thêm)
        // Duyệt qua từng vị trí, xem danh sách inventories có dữ liệu không
        for (Locations loc : locationsToDelete) {
            if (loc.getInventories() != null && !loc.getInventories().isEmpty()) {
                throw new RuntimeException(
                        "Không thể xóa kệ! Vị trí " + loc.getCode()
                                + " đang chứa hàng tồn kho. Vui lòng chuyển hàng đi nơi khác trước.");
            }
        }

        // 3. Nếu không có hàng thì mới xóa
        locationRepository.deleteAll(locationsToDelete);
    }

    // === Logic lấy vị trí trống ===
    @Override
    public List<String> getAvailableShelves() {
        // Tìm tất cả Location là SHELF_STORAGE và chưa đầy (isFull = false)
        List<Locations> emptyLocs = locationRepository.findByLocationTypeAndIsFullFalse(LocationType.SHELF_STORAGE);

        // Chỉ lấy ra mã code (VD: A-S01-01)
        return emptyLocs.stream()
                .map(Locations::getCode)
                .collect(Collectors.toList());
    }

    @Override
    public List<String> getAllLocationCodes() {
        // Lưu ý: Nếu dữ liệu lớn, nên viết thêm method findCodesOnly() trong Repository
        // để tối ưu hiệu suất
        // Ở đây dùng findAll() và map để đảm bảo chạy được ngay với JPA Repository
        // chuẩn
        return locationRepository.findAll().stream()
                .map(Locations::getCode)
                .collect(Collectors.toList());
    }

    @Override
    public String getLocationCodeById(Long id) {
        return locationRepository.findById(id)
                .map(Locations::getCode)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vị trí với ID: " + id));
    }

    @Override
    public Boolean isLocationFull(Long id) {
        return locationRepository.findById(id)
                // Lưu ý: Tùy vào Lombok generate, getter có thể là getIsFull() hoặc isFull()
                // Ở đây mình giả định dùng getIsFull() cho kiểu Boolean wrapper
                .map(Locations::getIsFull)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy vị trí với ID: " + id));
    }
    @Override
    @Transactional
    public void deleteLocation(String code) {
        Optional<Locations> locationOpt = locationRepository.findAll().stream()
                .filter(l -> l.getCode().equals(code))
                .findFirst();

        if (locationOpt.isEmpty()) {
            throw new RuntimeException("Không tìm thấy vị trí có mã: " + code);
        }

        Locations loc = locationOpt.get();

        // Kiểm tra tồn kho
        if (loc.getInventories() != null && !loc.getInventories().isEmpty()) {
            throw new RuntimeException("Vị trí " + code + " đang có hàng tồn kho, không thể xóa!");
        }

        locationRepository.delete(loc);
    }
}