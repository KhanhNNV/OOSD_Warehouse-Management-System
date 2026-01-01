package edu.uth.wms.dto.response;

public class ZoneResponse {
    private String zoneName; // Ví dụ: "A", "B"

    public ZoneResponse(String zoneName) {
        this.zoneName = zoneName;
    }
    // Getters & Setters
    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }
}