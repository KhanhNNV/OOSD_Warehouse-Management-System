package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.InboundResultDetail; // 👈 Đảm bảo đã import DTO này
import edu.uth.wms.exceptions.InboundValidationException; // 👈 Đảm bảo đã import Exception này
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.POStatus;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IInboundService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InboundServiceImpl implements IInboundService {

    private final IPurchaseOrderRepository poRepo;
    private final IInboundNoteRepository inboundNoteRepo;
    private final IProductsRepository productRepo;
    private final IInventoryRepository inventoryRepo;
    private final ILocationRepository locationRepo;
    private final IIboundDetailRepository inboundDetailRepo;

    @Override
    @Transactional
    public InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems) {
        // A. Lấy thông tin PO
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng PO: " + poId));

        // ========================================================================
        // 👇 1. VALIDATION (SOI HÀNG) - ĐOẠN MỚI THÊM VÀO ĐÂY
        // ========================================================================

        // Tạo danh sách các ID sản phẩm được phép nhập (Whitelist) từ PO
        List<Long> allowedProductIds = po.getDetails().stream()
                .map(d -> d.getProduct().getId())
                .collect(Collectors.toList());

        List<InboundResultDetail> checkResults = new ArrayList<>();
        boolean hasError = false;

        // Duyệt qua từng món hàng nhân viên gửi lên để kiểm tra
        for (InboundSubmitRequest item : actualItems) {
            Long staffProductId = item.getProductId();

            // CHECK: Sản phẩm này có nằm trong đơn hàng không?
            if (!allowedProductIds.contains(staffProductId)) {
                // ❌ LỖI: Hàng lạ, không có trong PO
                checkResults.add(InboundResultDetail.builder()
                        .productId(String.valueOf(staffProductId))
                        .isValid(false)
                        .message("Sản phẩm không có trong đơn hàng này")
                        .build());
                hasError = true;
            } else {
                // ✅ HỢP LỆ
                // (Bạn có thể thêm check số lượng ở đây nếu muốn chặn nhập lố)
                checkResults.add(InboundResultDetail.builder()
                        .productId(String.valueOf(staffProductId))
                        .isValid(true)
                        .message("OK")
                        .build());
            }
        }

        // 🛑 NẾU CÓ BẤT KỲ LỖI NÀO -> DỪNG NGAY, NÉM RA EXCEPTION
        if (hasError) {
            // GlobalExceptionHandler sẽ bắt lỗi này và trả về JSON danh sách lỗi cho Frontend
            throw new InboundValidationException("Phát hiện lỗi nhập kho", checkResults);
        }

        // ========================================================================
        // 👇 PHẦN CODE CŨ (LOGIC LƯU DỮ LIỆU) - CHỈ CHẠY KHI KHÔNG CÓ LỖI
        // ========================================================================

        // B. Tạo Phiếu Nhập (InboundNote) mới
        InboundNote note = new InboundNote();
        note.setNoteNumber("INB-" + UUID.randomUUID().toString().substring(0, 8));
        note.setPurchaseOrder(po);
        note.setReceivedDate(LocalDateTime.now());
        note.setStatus(InboundStatus.VERIFIED);
        
        // C. Xử lý chi tiết sản phẩm
        Map<Long, Integer> actualMap = actualItems.stream()
                .collect(Collectors.toMap(InboundSubmitRequest::getProductId, InboundSubmitRequest::getActualQty));

        List<InboundDetail> currentDetails = new ArrayList<>();

        for (PODetail planItem : po.getDetails()) {
            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(planItem.getProduct());

            Integer currentActualQty = actualMap.getOrDefault(planItem.getProduct().getId(), 0);
            detail.setActualQty(currentActualQty);

            int diff = currentActualQty - planItem.getExpectedQty();
            if (diff == 0) detail.setNote("Khớp (Lần nhập này)");
            else if (diff < 0) detail.setNote("Nhập ít hơn kế hoạch: " + Math.abs(diff));
            else detail.setNote("Nhập thừa: " + diff);

            currentDetails.add(detail);
            actualMap.remove(planItem.getProduct().getId());
        }

        // Logic Unplanned cũ (Giữ lại để đề phòng, dù Validation ở trên đã chặn rồi)
        if (!actualMap.isEmpty()) {
            for (Map.Entry<Long, Integer> entry : actualMap.entrySet()) {
                InboundDetail strangeItem = new InboundDetail();
                strangeItem.setInboundNote(note);
                strangeItem.setProduct(productRepo.findById(entry.getKey()).orElse(null));
                strangeItem.setActualQty(entry.getValue());
                strangeItem.setNote("HÀNG NGOÀI PO (UNPLANNED)");
                currentDetails.add(strangeItem);
            }
        }

        note.setInboundDetails(currentDetails);
        InboundNote savedNote = inboundNoteRepo.save(note);

        // --- D. CẬP NHẬT PO & TÍNH TỔNG ---

        // 1. Tính tổng đã nhập
        int totalReceived = inboundDetailRepo.sumTotalActualQtyByPoId(poId);
        po.setReceivedItems(totalReceived);
        po.setRetryCount((po.getRetryCount() == null ? 0 : po.getRetryCount()) + 1);

        // 2. So sánh tổng
        int expectedTotal = po.getDetails().stream()
                .mapToInt(PODetail::getExpectedQty)
                .sum();

        if (totalReceived >= expectedTotal) {
            po.setStatus(POStatus.COMPLETED);
            savedNote.setStatus(InboundStatus.COMPLETED);
            updateInventoryFromInbound(currentDetails);
        } else {
            po.setStatus(POStatus.DISCREPANCY);
            savedNote.setStatus(InboundStatus.VERIFIED);
        }

        poRepo.save(po);

        return savedNote;
    }

    // --- CÁC HÀM KHÁC (GIỮ NGUYÊN NHƯ CŨ) ---

    private void updateInventoryFromInbound(List<InboundDetail> details) {
        if (details == null || details.isEmpty()) return;

        Locations stageLocation = locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho nào thuộc diện STAGE_LOC!"));

        for (InboundDetail detail : details) {
            if (detail.getActualQty() > 0 && detail.getProduct() != null) {
                Long productId = detail.getProduct().getId();
                int qtyToAdd = detail.getActualQty();

                Inventory inventory = inventoryRepo.findByProduct_IdAndLocation_Id(productId, stageLocation.getId())
                        .orElse(null);

                if (inventory != null) {
                    inventory.setQuantity(inventory.getQuantity() + qtyToAdd);
                } else {
                    inventory = new Inventory();
                    inventory.setProduct(detail.getProduct());
                    inventory.setQuantity(qtyToAdd);
                    inventory.setLocation(stageLocation);
                    inventory.setManufactureDate(LocalDate.now());
                    inventory.setExpiryDate(LocalDate.now());
                }
                inventoryRepo.save(inventory);
            }
        }
    }

    @Override
    @Transactional
    public InboundNote approveInboundDifference(Long poId) {
        List<InboundNote> pendingNotes = inboundNoteRepo.findByPurchaseOrderId(poId).stream()
                .filter(n -> n.getStatus() == InboundStatus.VERIFIED)
                .collect(Collectors.toList());

        if (pendingNotes.isEmpty()) {
            throw new RuntimeException("Không tìm thấy phiếu nhập nào cần duyệt cho PO: " + poId);
        }

        for (InboundNote note : pendingNotes) {
            note.setStatus(InboundStatus.COMPLETED);
            note.setStaffSignature("Manager Approved Difference");
            updateInventoryFromInbound(note.getInboundDetails());
            inboundNoteRepo.save(note);
        }

        PurchaseOrder po = pendingNotes.get(0).getPurchaseOrder();
        po.setStatus(POStatus.COMPLETED);
        poRepo.save(po);

        return pendingNotes.get(pendingNotes.size() - 1);
    }


    @Override
    @Transactional
    public void cancelInbound(Long poId, String reason) {
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO: " + poId));

        List<InboundNote> pendingNotes = inboundNoteRepo.findByPurchaseOrderId(poId).stream()
                .filter(n -> n.getStatus() != InboundStatus.COMPLETED && n.getStatus() != InboundStatus.CANCELLED)
                .collect(Collectors.toList());

        if (pendingNotes.isEmpty()) {
            throw new RuntimeException("Không có phiếu nhập nào để hủy cho PO này!");
        }

        for (InboundNote note : pendingNotes) {
            note.setStatus(InboundStatus.CANCELLED);
            note.setStaffSignature("Manager REJECTED");
            inboundNoteRepo.save(note);
        }

        po.setStatus(POStatus.CANCELLED);
        poRepo.save(po);
    }
}