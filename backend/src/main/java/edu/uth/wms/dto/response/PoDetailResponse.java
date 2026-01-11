package edu.uth.wms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;


@Getter @Setter @SuperBuilder
@NoArgsConstructor
public class PoDetailResponse extends PoDetailBaseResponse{
    private Integer expectedQty;
}
