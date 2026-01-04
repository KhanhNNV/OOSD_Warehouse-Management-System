package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.service.IInventoryMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
public class InventoryMovementController {
    private final IInventoryMovementService service;
    @PostMapping("/pick")
    public ResponseEntity<String> pickItems(
            @RequestBody InternalPickRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        service.pickFromStageToTransit(authentication.getName(), request);
        return ResponseEntity.ok("Pick successfully!");
    }

    @PostMapping("/put-away")
    public ResponseEntity<String> putAwayItems(
            @RequestBody PutAwayRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        service.putAwayToShelf(authentication.getName(), request);
        return ResponseEntity.ok("Put away successfully!");
    }
}
