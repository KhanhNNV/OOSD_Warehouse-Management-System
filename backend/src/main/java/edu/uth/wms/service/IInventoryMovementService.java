package edu.uth.wms.service;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.dto.request.RelocateRequest;
import edu.uth.wms.dto.response.InventoryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

public interface IInventoryMovementService {

    String pickFromStageToTransit(String username, List<InternalPickRequest> requests);

    void putAwayToShelf(String username, PutAwayRequest request);

    List<InventoryResponse> getTransitInventory();

    void relocateInventory(String username, RelocateRequest request);
}
