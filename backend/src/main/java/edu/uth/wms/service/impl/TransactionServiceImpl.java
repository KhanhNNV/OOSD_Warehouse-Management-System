package edu.uth.wms.service.impl;

import edu.uth.wms.dto.response.InventoryTransactionResponse;
import edu.uth.wms.model.InventoryTransaction;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.repository.ITransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import jakarta.persistence.criteria.Predicate;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionServiceImpl {

    private final ITransactionRepository transactionRepo;

    public Page<InventoryTransactionResponse> getTransactions(
            LocalDate fromDate,
            LocalDate toDate,
            TransactionType type,
            String referenceCode,
            String performedBy,
            String productKeyword,
            int page,
            int size
    ) {
        // 1. Sửa "createdDate" -> "timestamp" trong Sort
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        Specification<InventoryTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. Lọc theo Type
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // 2. Lọc theo Ngày
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), fromDate.atStartOfDay()));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), toDate.atTime(23, 59, 59)));
            }

            // 3. Lọc theo Mã chứng từ (Reference Code) - Tìm gần đúng, không phân biệt hoa thường
            if (StringUtils.hasText(referenceCode)) {
                String pattern = "%" + referenceCode.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("referenceDocId")), pattern));
            }

            // 4. Lọc theo Người thực hiện (Performed By) - Join bảng User
            if (StringUtils.hasText(performedBy)) {
                String pattern = "%" + performedBy.toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("performedBy").get("fullName")), pattern));
            }

            // 5. Lọc theo Sản phẩm (Product) - Tìm theo Tên HOẶC SKU
            if (StringUtils.hasText(productKeyword)) {
                String pattern = "%" + productKeyword.toLowerCase() + "%";
                Predicate matchName = cb.like(cb.lower(root.get("product").get("name")), pattern);
                Predicate matchSku = cb.like(cb.lower(root.get("product").get("sku")), pattern);

                predicates.add(cb.or(matchName, matchSku));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<InventoryTransaction> pageResult = transactionRepo.findAll(spec, pageable);

        return pageResult.map(this::mapToResponse);
    }

    private InventoryTransactionResponse mapToResponse(InventoryTransaction tx) {
        return InventoryTransactionResponse.builder()
                .id(tx.getId())
                .type(tx.getType())
                .productName(tx.getProduct() != null ? tx.getProduct().getName() : "Sản phẩm đã xóa")
                .productSku(tx.getProduct() != null ? tx.getProduct().getSku() : "---")
                .locationCode(tx.getLocation() != null ? tx.getLocation().getCode() : "---")
                .quantityBefore(tx.getQuantityBefore())
                .quantityChanged(tx.getQuantityChanged())
                .quantityAfter(tx.getQuantityAfter())
                .referenceDocId(tx.getReferenceDocId())
                .createdDate(tx.getTimestamp())
                .performedBy(tx.getPerformedBy().getFullName())
                .build();
    }
}