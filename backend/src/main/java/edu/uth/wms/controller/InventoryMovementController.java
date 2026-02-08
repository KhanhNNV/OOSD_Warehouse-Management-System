package edu.uth.wms.controller;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.dto.request.RelocateRequest;
import edu.uth.wms.dto.response.InventoryResponse;
import edu.uth.wms.service.IInventoryMovementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory-movements")
@RequiredArgsConstructor
public class InventoryMovementController {
    private final IInventoryMovementService service;


    @PostMapping("/pick")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<String> pickItems(@RequestBody List<InternalPickRequest> requests) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String refId = service.pickFromStageToTransit(authentication.getName(), requests);
        return ResponseEntity.ok(refId);
    }

    @PostMapping("/put-away")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<String> putAwayItems(
            @RequestBody PutAwayRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        service.putAwayToShelf(authentication.getName(), request);
        return ResponseEntity.ok("Put away thành công!");
    }

    @GetMapping("/transit")
    public ResponseEntity<List<InventoryResponse>> getTransitInventory(){
        return ResponseEntity.ok(service.getTransitInventory());
    }

    @PostMapping("/relocate")
    @PreAuthorize("hasAnyRole('STAFF','ADMIN')")
    public ResponseEntity<String> relocateItems(@RequestBody RelocateRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        service.relocateInventory(username, request);

        return ResponseEntity.ok("Di chuyển hàng thành công!");
    }
}
