package edu.uth.wms.dto.response;
import lombok.*;

@Data
@Builder
public class ScanPickResponse {
    private boolean success;
    private String message;
    private Integer currentInventory;
}