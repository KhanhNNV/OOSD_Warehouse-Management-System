package edu.uth.wms.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.uth.wms.model.Locations;
import edu.uth.wms.model.enums.LocationType;

@Repository
public interface ILocationRepository extends JpaRepository<Locations, Long> {

    // 1. Lấy danh sách các Zone duy nhất (Cắt chuỗi ký tự đầu tiên trước dấu "-")
    // Native Query cho MySQL: SUBSTRING_INDEX(code, '-', 1)
    @Query(value = "SELECT DISTINCT SUBSTRING_INDEX(code, '-', 1) FROM locations", nativeQuery = true)
    List<String> findDistinctZones();

    // 2. Lấy danh sách các Kệ thuộc một Zone cụ thể
    // Logic: Tìm các code bắt đầu bằng 'A-%', sau đó cắt lấy phần giữa (Shelf Code)
    @Query(value = "SELECT DISTINCT SUBSTRING_INDEX(SUBSTRING_INDEX(code, '-', 2), '-', -1) "
            + "FROM locations WHERE code LIKE CONCAT(?1, '-%')", nativeQuery = true)
    List<String> findDistinctShelvesByZone(String zoneCode);

    // 3. Tìm tất cả location thuộc về một Kệ để xóa
    // Ví dụ: Tìm tất cả bắt đầu bằng "A-S01-%"
    List<Locations> findByCodeStartingWith(String prefix);

    // 4. Kiểm tra xem code đã tồn tại chưa (tránh trùng lặp)
    boolean existsByCode(String code);

    // Tìm các vị trí theo Loại và Trạng thái đầy
    List<Locations> findByLocationTypeAndIsFullFalse(LocationType type);

    Optional<Locations> findByCode(String code);

    List<Locations> findByLocationType(LocationType locationType);

    Optional<Locations> findFirstByLocationType(LocationType locationType);

    /**
     * ✅ NEW: Tìm tất cả kệ trống (isFull = false)
     * 
     * @param locationType Loại vị trí (VD: SHELF_STORAGE)
     * @return Danh sách mã kệ trống
     */
    @Query("SELECT l.code FROM Locations l WHERE " + "l.locationType = :type AND " + "l.isFull = false "
            + "ORDER BY l.code ASC")
    List<String> findEmptyShelves(@Param("type") LocationType locationType);

    /**
     * ✅ NEW: Tìm kệ trống theo zone prefix
     * 
     * @param prefix Prefix của zone (VD: "A", "B")
     * @param type   Loại vị trí
     * @return Danh sách mã kệ trống
     */
    @Query("SELECT l.code FROM Locations l WHERE " + "l.locationType = :type AND " + "l.isFull = false AND "
            + "l.code LIKE CONCAT(:prefix, '%') " + "ORDER BY l.code ASC")
    List<String> findEmptyShelvesByZone(@Param("prefix") String prefix, @Param("type") LocationType type);
}