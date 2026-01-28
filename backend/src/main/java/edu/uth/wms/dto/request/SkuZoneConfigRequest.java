package edu.uth.wms.dto.request;

import lombok.Data;

@Data
public class SkuZoneConfigRequest {
    // Mã nhận diện (VD: DO, BK) - Bắt buộc
    private String skuPrefix;

    // Khu vực ưu tiên - Bắt buộc
    private String primaryZone;

    // Khu vực dự phòng - Tùy chọn
    private String backupZone;
}