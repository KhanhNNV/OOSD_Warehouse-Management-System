package edu.uth.wms.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter           // Bao gồm cả @Getter, @Setter, @ToString...
@Builder
@NoArgsConstructor 
@AllArgsConstructor
public class BatchPickingRequest {
    private Long outboundDetailId; 
    private Long productId;      
    private Long locationId;
    private Integer actualQty;     
    private Boolean isFlagged;     
    private String note;
}
