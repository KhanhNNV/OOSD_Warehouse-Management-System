package edu.uth.wms.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LocationVerifyRequest {
    private Long targetLocationId; // ID của vị trí hệ thống bảo đến (Lấy từ response trước đó)
    private String scannedLocationCode;    // Mã barcode User thực tế quét được
}

