package edu.uth.wms.dto.response;

import java.util.List;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)
// <T> ở đây sẽ là PoDetailResponse hoặc PoDetailForStaffResponse
public abstract class PurchaseOrderBaseResponse<T> {
    private Long id;
    private String poNumber;
    private String supplierName;
    private String status;
    private String createdAt;
    private String createdBy;
    private String createdByName;
    private String assigneeName;
    private Integer totalItems;

    // Field này linh động theo T
    private List<T> details;
}