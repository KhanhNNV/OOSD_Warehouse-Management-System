package edu.uth.wms.controller;

import edu.uth.wms.dto.response.InventoryTransactionResponse;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.service.impl.TransactionServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/transactions")
@RequiredArgsConstructor
public class AdminTransactionController {

    private final TransactionServiceImpl transactionService;

    @GetMapping
    public ResponseEntity<Page<InventoryTransactionResponse>> getAllTransactions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) String referenceCode,
            @RequestParam(required = false) String performedBy,
            @RequestParam(required = false) String productKeyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(transactionService.getTransactions(fromDate, toDate, type, referenceCode, performedBy, productKeyword, page, size
        ));
    }
}