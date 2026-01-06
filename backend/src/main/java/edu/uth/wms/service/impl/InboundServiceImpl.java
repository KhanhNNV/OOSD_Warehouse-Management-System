package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.InboundResultDetail; // 👈 Đảm bảo đã import DTO này
import edu.uth.wms.exceptions.InboundValidationException; // 👈 Đảm bảo đã import Exception này
import edu.uth.wms.exceptions.ResourceNotFoundException;
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
import java.util.*;
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

        if (po.getRetryCount() != null && po.getRetryCount() >= 3) {
            throw new InboundValidationException("Đã hết số lượt quét lại (3/3). Vui lòng liên hệ Manager để xử lý.", null);
        }

        // 1. Map số lượng dự kiến
        Map<Long, Integer> expectedQtyMap = po.getDetails().stream()
                .collect(Collectors.toMap(
                        d -> d.getProduct().getId(),
                        PODetail::getExpectedQty
                ));

        // 2. VALIDATION (Chỉ chặn hàng lạ, KHÔNG chặn số lượng thừa nữa)
        List<InboundResultDetail> checkResults = new ArrayList<>();
        boolean hasError = false;

        for (InboundSubmitRequest item : actualItems) {
            // Check hàng lạ (Không có trong PO) -> Cái này vẫn phải chặn
            if (!expectedQtyMap.containsKey(item.getProductId())) {
                checkResults.add(InboundResultDetail.builder()
                        .productId(String.valueOf(item.getProductId()))
                        .isValid(false)
                        .message("Sản phẩm không có trong đơn hàng này")
                        .build());
                hasError = true;
            }
        }

        if (hasError) {
            throw new InboundValidationException("Dữ liệu nhập kho không hợp lệ", checkResults);
        }

        // ========================================================================
        // 👇 LOGIC MỚI: GHI NHẬN THỪA -> ĐẨY VỀ CHO MANAGER DUYỆT
        // ========================================================================

        InboundNote note = new InboundNote();
        note.setNoteNumber("INB-" + UUID.randomUUID().toString().substring(0, 8));
        note.setPurchaseOrder(po);
        note.setReceivedDate(LocalDateTime.now());
        // Mặc định là VERIFIED (Đã kiểm đếm), chờ logic bên dưới quyết định
        note.setStatus(InboundStatus.VERIFIED);

        Map<Long, Integer> actualMap = actualItems.stream()
                .collect(Collectors.toMap(InboundSubmitRequest::getProductId, InboundSubmitRequest::getActualQty));

        List<InboundDetail> currentDetails = new ArrayList<>();
        boolean hasDiscrepancy = false; // Cờ đánh dấu xem có bị lệch không

        for (PODetail planItem : po.getDetails()) {
            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(planItem.getProduct());

            // Staff nhập bao nhiêu, ghi nhận bấy nhiêu (VD: 15)
            int staffInputQty = actualMap.getOrDefault(planItem.getProduct().getId(), 0);
            int planQty = planItem.getExpectedQty(); // VD: 10

            detail.setActualQty(staffInputQty);

            // 👇 GHI CHÚ TÌNH TRẠNG
            if (staffInputQty > planQty) {
                // TRƯỜNG HỢP THỪA: Ghi chú lại, đánh dấu lệch
                detail.setNote("Dư " + (staffInputQty - planQty) + " cái");
                hasDiscrepancy = true;
            } else if (staffInputQty < planQty) {
                // TRƯỜNG HỢP THIẾU
                detail.setNote("Thiếu " + (planQty - staffInputQty) + " cái");
                // Thiếu cũng coi là lệch (nếu bạn muốn nhập đủ 100% mới thôi)
                // Hoặc tùy nghiệp vụ, ở đây mình tạm coi thiếu là lệch luôn
                hasDiscrepancy = true;
            } else {
                detail.setNote("Khớp");
            }

            currentDetails.add(detail);
            actualMap.remove(planItem.getProduct().getId());
        }

        note.setInboundDetails(currentDetails);
        InboundNote savedNote = inboundNoteRepo.save(note);

        // --- CẬP NHẬT TRẠNG THÁI PO ---

        int totalReceived = inboundDetailRepo.sumTotalActualQtyByPoId(poId);
        po.setReceivedItems(totalReceived);
        po.setRetryCount((po.getRetryCount() == null ? 0 : po.getRetryCount()) + 1);

        // 👇 LOGIC QUYẾT ĐỊNH: KHI NÀO VÀO KHO? KHI NÀO CHỜ DUYỆT?
        if (hasDiscrepancy) {
            // ❌ NẾU CÓ LỆCH (Thừa hoặc Thiếu)
            po.setStatus(POStatus.DISCREPANCY);       // Trạng thái PO: Lệch
            savedNote.setStatus(InboundStatus.VERIFIED); // Trạng thái Phiếu: Chờ duyệt (Chưa vào kho)

            // ⚠️ QUAN TRỌNG: KHÔNG GỌI updateInventoryFromInbound() Ở ĐÂY
            // Để Manager bấm nút "Duyệt" thì mới cộng kho.
        } else {
            // ✅ NẾU KHỚP HOÀN TOÀN (10/10)
            po.setStatus(POStatus.COMPLETED);
            savedNote.setStatus(InboundStatus.COMPLETED);

            // Tự động vào kho luôn
            updateInventoryFromInbound(currentDetails);
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
    @Override
    public InboundNote getPendingInboundNote(Long poId) {
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy PO: " + poId));

        // 1. Lấy tất cả các phiếu nhập (Note) của PO này từ trước đến giờ
        // Ví dụ: Lần 1 (5 cái), Lần 2 (1 cái), Lần 3 (3 cái)
        List<InboundNote> allNotes = inboundNoteRepo.findByPurchaseOrderId(poId);

        // 2. Cộng dồn số lượng thực tế theo từng sản phẩm
        // Kết quả map: { ProductA: 9, ProductB: ... }
        Map<Long, Integer> totalActualMap = new HashMap<>();

        for (InboundNote note : allNotes) {
            if (note.getInboundDetails() != null) {
                for (InboundDetail d : note.getInboundDetails()) {
                    Long pId = d.getProduct().getId();
                    totalActualMap.put(pId, totalActualMap.getOrDefault(pId, 0) + d.getActualQty());
                }
            }
        }

        // 3. Tạo một InboundNote "Tổng hợp" (Giả) để trả về cho Frontend hiển thị
        // Note này không lưu xuống DB, chỉ dùng để hiện lên Modal Manager
        InboundNote summaryNote = new InboundNote();
        summaryNote.setId(0L); // ID giả
        summaryNote.setPurchaseOrder(po);
        summaryNote.setNoteNumber("TONG-HOP-" + po.getPoNumber());
        summaryNote.setReceivedDate(LocalDateTime.now());

        List<InboundDetail> summaryDetails = new ArrayList<>();

        // 4. Duyệt qua danh sách KẾ HOẠCH (PO Details) để so sánh với TỔNG THỰC TẾ
        for (PODetail planItem : po.getDetails()) {
            InboundDetail detail = new InboundDetail();
            detail.setProduct(planItem.getProduct());

            // Lấy tổng đã cộng dồn (Nếu chưa nhập thì là 0)
            int totalActual = totalActualMap.getOrDefault(planItem.getProduct().getId(), 0);
            int planQty = planItem.getExpectedQty();

            // 🔥 ĐÂY LÀ CHỖ QUAN TRỌNG NHẤT: Trả về TỔNG (9) chứ không phải lần cuối (3)
            detail.setActualQty(totalActual);

            // Logic Note hiển thị tình trạng cho Manager đọc
            if (totalActual < planQty) {
                detail.setNote("Thiếu " + (planQty - totalActual) + " cái (Tổng: " + totalActual + "/" + planQty + ")");
            } else if (totalActual > planQty) {
                detail.setNote("Dư " + (totalActual - planQty) + " cái");
            } else {
                detail.setNote("Đủ hàng (" + totalActual + ")");
            }

            summaryDetails.add(detail);
        }

        summaryNote.setInboundDetails(summaryDetails);
        return summaryNote;
    }
}