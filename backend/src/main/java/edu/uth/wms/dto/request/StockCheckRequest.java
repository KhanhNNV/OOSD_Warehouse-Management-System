// StockCheckRequest.java
package edu.uth.wms.dto.request;
import lombok.Data;

@Data
public class StockCheckRequest {
    private Long productId;
    private Integer quantity;
}