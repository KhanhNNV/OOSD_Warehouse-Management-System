package edu.uth.wms.dto.request;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BatchPickingRequest {
    private Long outboundDetailId; 
    private Long productId;
    private Long locationId;        
    private Integer actualQty;     
    private Boolean isFlagged;     
    private String note;
}
