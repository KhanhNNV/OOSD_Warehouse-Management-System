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
            int page,
            int size
    ) {
        // 1. Sửa "createdDate" -> "timestamp" trong Sort
        Pageable pageable = PageRequest.of(page, size, Sort.by("timestamp").descending());

        Specification<InventoryTransaction> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }

            // 2. Sửa "createdDate" -> "timestamp" trong điều kiện lọc
            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("timestamp"), fromDate.atStartOfDay()));
            }

            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("timestamp"), toDate.atTime(23, 59, 59)));
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
                .build();
    }
}