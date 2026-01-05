package edu.uth.wms.dto.response;

import edu.uth.wms.model.enums.LocationType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

@Data
@AllArgsConstructor
@Builder
public class LocationResponse {
    private Long id;
    private String code;
    private LocationType locationType;
}
