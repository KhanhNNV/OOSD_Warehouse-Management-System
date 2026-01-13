package edu.uth.wms.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
@AllArgsConstructor
public class VerifyResponse {
    @JsonProperty("isMatched")
    private boolean isMatched;  // true: Khớp, false: Sai
    private String message;     // Thông báo chi tiết
    private String systemData;
}