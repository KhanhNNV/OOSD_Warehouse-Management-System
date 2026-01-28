package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;
import edu.uth.wms.model.SkuZoneConfig;

@Data
@Builder
public class SkuZoneConfigResponse {
    private Long id;
    private String skuPrefix;
    private String primaryZone;
    private String backupZone;

    // Helper method để convert từ Entity sang Response
    public static SkuZoneConfigResponse fromEntity(SkuZoneConfig entity) {
        return SkuZoneConfigResponse.builder()
                .id(entity.getId())
                .skuPrefix(entity.getSkuPrefix())
                .primaryZone(entity.getPrimaryZone())
                .backupZone(entity.getBackupZone())
                .build();
    }
}