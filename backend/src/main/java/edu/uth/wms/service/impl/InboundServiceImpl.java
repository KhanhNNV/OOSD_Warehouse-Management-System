package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.model.enums.POStatus; // Nhớ import Enum POStatus
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IInboundService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional; // Import Optional
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InboundServiceImpl implements IInboundService {

    // 1. INJECT CÁC REPOSITORY CẦN THIẾT
    private final IPurchaseOrderRepository poRepo;
    private final IInboundNoteRepository inboundNoteRepo;
    private final IProductsRepository productRepo;
    private final IInventoryRepository inventoryRepo; // ---> QUAN TRỌNG: Phải có cái này để cộng kho
    private final ILocationRepository locationRepo;

    @Override
    @Transactional
    public InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems) {
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng PO: " + poId));

        InboundNote note = new InboundNote();
        note.setNoteNumber("INB-" + UUID.randomUUID().toString().substring(0, 8));
        note.setPurchaseOrder(po);
        note.setReceivedDate(LocalDateTime.now());

        Map<Long, Integer> actualMap = actualItems.stream()
                .collect(Collectors.toMap(InboundSubmitRequest::getProductId, InboundSubmitRequest::getActualQty));

        List<InboundDetail> resultDetails = new ArrayList<>();
        boolean hasError = false;

        for (PODetail planItem : po.getDetails()) {
            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(planItem.getProduct());

            Integer actualQty = actualMap.getOrDefault(planItem.getProduct().getId(), 0);
            detail.setActualQty(actualQty);

            int expectedQty = planItem.getExpectedQty();
            int diff = actualQty - expectedQty;

            if (diff == 0) {
                detail.setNote("KHỚP");
            } else if (diff < 0) {
                detail.setNote("THIẾU: " + Math.abs(diff));
                hasError = true;
            } else {
                detail.setNote("THỪA: " + diff);
                hasError = true;
            }

            resultDetails.add(detail);
            actualMap.remove(planItem.getProduct().getId());
        }

        if (!actualMap.isEmpty()) {
            hasError = true;
            for (Map.Entry<Long, Integer> entry : actualMap.entrySet()) {
                InboundDetail strangeItem = new InboundDetail();
                strangeItem.setInboundNote(note);
                strangeItem.setProduct(productRepo.findById(entry.getKey()).orElse(null));
                strangeItem.setActualQty(entry.getValue());
                strangeItem.setNote("HÀNG NGOÀI PO (UNPLANNED)");
                resultDetails.add(strangeItem);
            }
        }

        // --- ĐOẠN LOGIC QUYẾT ĐỊNH TRẠNG THÁI ---
        // --- LOGIC MỚI Ở ĐÂY ---
        if (hasError) {
            note.setStatus(InboundStatus.VERIFIED);

            // Thay vì RECEIVING, giờ set thành DISCREPANCY (Để hiện lên trang Manager)
            po.setStatus(POStatus.DISCREPANCY);
        } else {
            note.setStatus(InboundStatus.COMPLETED);
            updateInventoryFromInbound(resultDetails);
            po.setStatus(POStatus.COMPLETED);
        }

        poRepo.save(po); // Lưu POStatus mới
        note.setInboundDetails(resultDetails);
        return inboundNoteRepo.save(note);
    }

    // --- HÀM CỘNG KHO (Đã sửa: STAGE_LOC + Date) ---
    private void updateInventoryFromInbound(List<InboundDetail> details) {
        if (details == null) return;

        // 1. Tìm kho STAGE_LOC (Khu vực tập kết hàng)
        Locations stageLocation = locationRepo.findByCode("STAGE_LOC")
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy vị trí STAGE_LOC. Hãy chạy SQL Insert!"));

        for (InboundDetail detail : details) {
            if (detail.getActualQty() > 0 && detail.getProduct() != null) {
                Long productId = detail.getProduct().getId();
                int qtyToAdd = detail.getActualQty();

                System.out.println(">>> ĐANG CỘNG KHO STAGE: " + detail.getProduct().getName());

                // Tìm hàng ở STAGE_LOC
                // Lưu ý: Logic tìm inventory nên lọc theo cả Location nữa để tránh cộng nhầm vào KHO-TONG
                // Nhưng tạm thời mình cứ check theo Product trước cho đơn giản
                Inventory inventory = inventoryRepo.findByProductId(productId).orElse(null);

                // Nếu tìm thấy mà khác location thì phải tạo dòng mới (tránh gộp STAGE vào KHO-TONG)
                if (inventory != null && !inventory.getLocation().getCode().equals("STAGE_LOC")) {
                    inventory = null; // Force tạo mới
                }

                if (inventory != null) {
                    inventory.setQuantity(inventory.getQuantity() + qtyToAdd);
                } else {
                    inventory = new Inventory();
                    inventory.setProduct(detail.getProduct());
                    inventory.setQuantity(qtyToAdd);
                    inventory.setLocation(stageLocation); // Set vào STAGE_LOC

                    // --- MẶC ĐỊNH NGÀY HÔM NAY ---
                    inventory.setManufactureDate(java.time.LocalDate.now());
                    inventory.setExpiryDate(java.time.LocalDate.now());
                }

                inventoryRepo.save(inventory);
            }
        }
    }

    @Override
    @Transactional
    public InboundNote approveInboundDifference(Long poId) {
        InboundNote note = inboundNoteRepo.findByPurchaseOrderId(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập chờ duyệt của PO: " + poId));

        if (note.getStatus() != InboundStatus.VERIFIED) {
            throw new RuntimeException("Phiếu này đã xong hoặc chưa được kiểm, không cần duyệt!");
        }

        // 1. Cập nhật phiếu nhập
        note.setStatus(InboundStatus.COMPLETED);
        note.setStaffSignature("Manager Approved Difference");

        // 2. Cộng kho (Lấy list detail ra để cộng)
        updateInventoryFromInbound(note.getInboundDetails());

        // 3. Cập nhật PO -> COMPLETED (Đóng đơn)
        PurchaseOrder po = note.getPurchaseOrder();
        po.setStatus(POStatus.COMPLETED);
        poRepo.save(po); // ---> LƯU PO

        return inboundNoteRepo.save(note);
    }
}