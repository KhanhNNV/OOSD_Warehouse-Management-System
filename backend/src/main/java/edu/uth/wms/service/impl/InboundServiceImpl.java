package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IInboundService; // Import Interface
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor; // Dùng cái này thay cho @Autowired từng dòng cho gọn (giống nhóm bạn)
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor // Lombok tự tạo constructor cho các biến final
public class InboundServiceImpl implements IInboundService { // Nhớ implements Interface

    // Khai báo final để dùng RequiredArgsConstructor (Code nhóm bạn đang dùng cách này)
    private final IPurchaseOrderRepository poRepo;
    private final IInboundNoteRepository inboundNoteRepo;
    private final IProductsRepository productRepo;


    @Override
    @Transactional
    public InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems) {
        // --- COPY Y NGUYÊN ĐOẠN LOGIC CŨ VÀO ĐÂY ---

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

        if (hasError) {
            // Case 1: Có lỗi (Thiếu/Thừa/Sai) -> Chỉ lưu trạng thái VERIFIED để Manager duyệt sau
            note.setStatus(InboundStatus.VERIFIED);
            // KHÔNG cộng kho ở đây
        } else {
            // Case 2: Khớp 100% -> Lưu trạng thái COMPLETED
            note.setStatus(InboundStatus.COMPLETED);

            // ---> BỔ SUNG DÒNG NÀY <---
            // Gọi hàm phụ để cộng số lượng thực tế vào kho (Inventory)
            updateInventoryFromInbound(note);
        }

        note.setInboundDetails(resultDetails);
        return inboundNoteRepo.save(note);
    }

    // Hàm phụ: Cộng hàng vào kho (Chạy khi status = COMPLETED)
    // --- HÀM PHỤ: CỘNG TỒN KHO ---
    // --- HÀM PHỤ: CỘNG TỒN KHO (Đã sửa: Chỉ nhận 1 tham số) ---
    private void updateInventoryFromInbound(InboundNote note) {
        // Lấy danh sách chi tiết từ chính cái Note truyền vào
        List<InboundDetail> details = note.getInboundDetails();

        if (details == null) return; // Tránh lỗi NullPointer

        for (InboundDetail detail : details) {
            if (detail.getActualQty() > 0 && detail.getProduct() != null) {
                System.out.println(">>> ĐANG CỘNG KHO: " + detail.getProduct().getName() + " | SL: " + detail.getActualQty());

                // TODO: Gọi InventoryService để cộng kho thật ở đây
                // inventoryService.addStock(detail.getProduct().getId(), detail.getActualQty());
            }
        }
    }

    @Override
    @Transactional
    public InboundNote approveInboundDifference(Long poId) {
        // 1. Tìm cái phiếu đang bị treo (VERIFIED) của PO này
        InboundNote note = inboundNoteRepo.findByPurchaseOrderId(poId) // Bạn tự viết hàm query này hoặc findByNoteId nhé
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiếu nhập"));

        // 2. Check trạng thái: Chỉ duyệt cái nào đang chờ
        if (note.getStatus() != InboundStatus.VERIFIED) {
            throw new RuntimeException("Phiếu này đã xong hoặc chưa được kiểm, không cần duyệt!");
        }

        // 3. Chốt sổ
        note.setStatus(InboundStatus.COMPLETED);
        note.setStaffSignature("Manager Approved Difference"); // Đánh dấu là sếp đã duyệt

        // 4. Cộng kho (Dù thiếu cũng cộng số thực tế vào)
        updateInventoryFromInbound(note);

        return inboundNoteRepo.save(note);
    }

}