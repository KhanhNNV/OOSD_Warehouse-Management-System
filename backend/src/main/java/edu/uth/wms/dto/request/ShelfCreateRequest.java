package edu.uth.wms.dto.request;

public class ShelfCreateRequest {
    private String zoneCode;   // Ví dụ: "A"
    private String shelfCode;  // Ví dụ: "S01"
    private int totalLevels;   // Số ô trong 1 kệ, ví dụ: 3 (sẽ tạo ra 3 location)

    // Getters & Setters
    public String getZoneCode() { return zoneCode; }
    public void setZoneCode(String zoneCode) { this.zoneCode = zoneCode; }
    public String getShelfCode() { return shelfCode; }
    public void setShelfCode(String shelfCode) { this.shelfCode = shelfCode; }
    public int getTotalLevels() { return totalLevels; }
    public void setTotalLevels(int totalLevels) { this.totalLevels = totalLevels; }
}
