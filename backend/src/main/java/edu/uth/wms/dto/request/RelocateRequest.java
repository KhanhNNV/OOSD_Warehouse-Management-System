package edu.uth.wms.dto.request;

import lombok.Data;

@Data
public class RelocateRequest {
    private String barcode;
    private String fromLocationCode; // Vị trí nguồn (VD: A-01-01)
    private String toLocationCode;   // Vị trí đích (VD: B-02-02)
    private Integer quantity;
}