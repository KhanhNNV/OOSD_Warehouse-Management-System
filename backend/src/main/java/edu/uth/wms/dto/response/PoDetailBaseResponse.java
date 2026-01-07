package edu.uth.wms.dto.response;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
public class PoDetailBaseResponse { // Class cha
    private Long id;
    private Long productId;
    private String productSku;
    private String productName;
}
