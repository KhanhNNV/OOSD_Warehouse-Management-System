package edu.uth.wms.dto.request;

import lombok.Data;

@Data
public class InternalPickRequest {
    private Long productId;
    private Integer quantity;
    private Long stageLocationId; // ID của khu vực STAGE
}
