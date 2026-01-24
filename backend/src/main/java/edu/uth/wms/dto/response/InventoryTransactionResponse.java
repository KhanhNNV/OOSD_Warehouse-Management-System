package edu.uth.wms.dto.response;

import edu.uth.wms.model.enums.TransactionType;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class InventoryTransactionResponse {
    private Long id;
    private TransactionType type;
    private String productName;
    private String productSku;
    private String locationCode; // Tên kệ/kho
    private Integer quantityBefore;
    private Integer quantityChanged; // Số lượng thay đổi
    private Integer quantityAfter;
    private String referenceDocId; // Mã PO hoặc Order
    private String performedBy; // Tên người thực hiện (nếu có lưu)
    private LocalDateTime createdDate; // Ngày giờ thực hiện
}