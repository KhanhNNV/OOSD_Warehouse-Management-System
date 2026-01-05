package edu.uth.wms.exceptions;

import edu.uth.wms.dto.response.InboundResultDetail;
import lombok.Getter;
import java.util.List;

@Getter
public class InboundValidationException extends RuntimeException {
    private final List<InboundResultDetail> results;

    public InboundValidationException(String message, List<InboundResultDetail> results) {
        super(message);
        this.results = results;
    }
}