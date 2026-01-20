package edu.uth.wms.dto.request;
import lombok.Data;

@Data
public class ScanPickRequest {
    private Long orderId;
    private Long inventoryId;
    private String locationCode;
    private Integer quantity;
}
