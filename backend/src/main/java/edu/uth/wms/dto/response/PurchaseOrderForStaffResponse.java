package edu.uth.wms.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
// Kế thừa Base và chỉ định T là PoDetailForStaffResponse
public class PurchaseOrderForStaffResponse extends PurchaseOrderBaseResponse<PoDetailForStaffResponse> {

}