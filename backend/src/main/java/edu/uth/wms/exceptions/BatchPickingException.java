package edu.uth.wms.exceptions;

import edu.uth.wms.dto.response.BatchPickingErrorDetail;
import lombok.Getter;

import java.util.List;

@Getter
public class BatchPickingException extends RuntimeException {
    private final List<BatchPickingErrorDetail> errorDetails;

    public BatchPickingException(List<BatchPickingErrorDetail> errorDetails) {
        super("Có lỗi xảy ra trong quá trình kiểm tra hàng xuất kho");
        this.errorDetails = errorDetails;
    }
}