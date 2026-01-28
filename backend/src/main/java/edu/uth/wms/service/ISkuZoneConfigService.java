package edu.uth.wms.service;

import edu.uth.wms.dto.request.SkuZoneConfigRequest;
import edu.uth.wms.dto.response.SkuZoneConfigResponse;
import java.util.List;

public interface ISkuZoneConfigService {
    // Lấy tất cả cấu hình
    List<SkuZoneConfigResponse> getAllConfigs();

    // Lấy chi tiết theo ID
    SkuZoneConfigResponse getConfigById(Long id);

    // Tạo mới
    SkuZoneConfigResponse createConfig(SkuZoneConfigRequest request);

    // Cập nhật
    SkuZoneConfigResponse updateConfig(Long id, SkuZoneConfigRequest request);

    // Xóa
    void deleteConfig(Long id);
}