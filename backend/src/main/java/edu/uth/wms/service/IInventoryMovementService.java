package edu.uth.wms.service;

import edu.uth.wms.dto.request.InternalPickRequest;
import edu.uth.wms.dto.request.PutAwayRequest;
import edu.uth.wms.dto.response.InventoryResponse;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;

import java.util.List;

public interface IInventoryMovementService {
    /**
     * Nhịp 1: Handover (Bàn giao trách nhiệm)
     * Chuyển hàng từ vị trí STAGE sang vị trí ảo TRANSIT của nhân viên.
     * * @param userId ID của nhân viên thực hiện (người nhận trách nhiệm)
     * @param request Thông tin hàng hóa và vị trí nguồn
     */
    void pickFromStageToTransit(String username, InternalPickRequest request);

    /**
     * Nhịp 2: Putaway (Hoàn thành nhiệm vụ)
     * Chuyển hàng từ vị trí ảo TRANSIT lên kệ SHELF thực tế.
     * * @param userId ID của nhân viên thực hiện (người trả trách nhiệm)
     * @param request Thông tin hàng hóa và vị trí đích
     */
    void putAwayToShelf(String username, PutAwayRequest request);

    List<InventoryResponse> getTransitInventory();
}
