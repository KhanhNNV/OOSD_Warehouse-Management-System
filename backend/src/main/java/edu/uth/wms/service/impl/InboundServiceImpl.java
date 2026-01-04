package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.InboundSubmitRequest;
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

    // 👇 1. THÊM CÁI NÀY ĐỂ TÍNH TỔNG
    private final IIboundDetailRepository inboundDetailRepo;

    @Override
    @Transactional
    public InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems) {
        // A. Lấy thông tin PO
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng PO: " + poId));

        // B. Tạo Phiếu Nhập (InboundNote) mới cho lần nhập này
        InboundNote note = new InboundNote();
        note.setNoteNumber("INB-" + UUID.randomUUID().toString().substring(0, 8));
        note.setPurchaseOrder(po);
        note.setReceivedDate(LocalDateTime.now());
        // Mặc định set là VERIFIED (Đã kiểm), lát tính xong sẽ quyết định sau
        note.setStatus(InboundStatus.VERIFIED);

        // C. Xử lý chi tiết sản phẩm (Mapping dữ liệu gửi lên)
        Map<Long, Integer> actualMap = actualItems.stream()
                .collect(Collectors.toMap(InboundSubmitRequest::getProductId, InboundSubmitRequest::getActualQty));

        List<InboundDetail> currentDetails = new ArrayList<>();

        // Duyệt qua danh sách dự kiến của PO để tạo chi tiết nhập
        for (PODetail planItem : po.getDetails()) {
            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(planItem.getProduct());

            // Lấy số lượng thực tế trong lần gửi này (Nếu không gửi thì là 0)
            Integer currentActualQty = actualMap.getOrDefault(planItem.getProduct().getId(), 0);
            detail.setActualQty(currentActualQty);

            // Ghi chú tạm thời cho phiếu này (Ví dụ: Lần này nhập 2, nhưng PO cần 10 => Ghi thiếu 8)
            // Lưu ý: Đây chỉ là ghi chú cho từng lần nhập lẻ
            int diff = currentActualQty - planItem.getExpectedQty();
            if (diff == 0) detail.setNote("Khớp (Lần nhập này)");
            else if (diff < 0) detail.setNote("Nhập ít hơn kế hoạch: " + Math.abs(diff));
            else detail.setNote("Nhập thừa: " + diff);

            currentDetails.add(detail);
            actualMap.remove(planItem.getProduct().getId());
        }

        // Xử lý hàng lạ (Unplanned)
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

        // 👇 D. QUAN TRỌNG: LƯU PHIẾU NHẬP TRƯỚC ĐỂ DỮ LIỆU VÀO DB
        // Phải lưu xong thì câu query tính tổng bên dưới mới thấy được số liệu mới nhất
        InboundNote savedNote = inboundNoteRepo.save(note);


        // --- E. LOGIC CỘNG DỒN & CẬP NHẬT PO (MỚI) ---

        // 1. Tính tổng số lượng thực tế đã nhập cho PO này (Từ trước tới giờ + Lần này)
        // Hàm này nằm trong IInboundDetailRepository (Xem code bên dưới nếu chưa có)
        int totalReceived = inboundDetailRepo.sumTotalActualQtyByPoId(poId);

        // 2. Cập nhật số liệu vào PO
        po.setReceivedItems(totalReceived);

        // 3. Tăng biến đếm số lần thử (Retry Count)
        po.setRetryCount((po.getRetryCount() == null ? 0 : po.getRetryCount()) + 1);

        // 4. So sánh TỔNG THỰC TẾ vs TỔNG DỰ KIẾN

        // 👇 TÍNH TỔNG NGAY TẠI SERVICE (Thay cho po.getTotalItems())
        int expectedTotal = po.getDetails().stream()
                .mapToInt(PODetail::getExpectedQty)
                .sum();

        if (totalReceived >= expectedTotal) {
            // ĐỦ HÀNG -> Hoàn thành
            po.setStatus(POStatus.COMPLETED);
            savedNote.setStatus(InboundStatus.COMPLETED);

            updateInventoryFromInbound(currentDetails);
        } else {
            // THIẾU HÀNG -> Lệch
            po.setStatus(POStatus.DISCREPANCY);
            savedNote.setStatus(InboundStatus.VERIFIED);
        }

        // 5. Lưu PO
        poRepo.save(po);

        return savedNote;
    }

    // --- HÀM CỘNG KHO (GIỮ NGUYÊN) ---
    // Hàm cập nhật kho (Logic mới: Tìm theo Type & Date mặc định hôm nay)
    private void updateInventoryFromInbound(List<InboundDetail> details) {
        if (details == null || details.isEmpty()) return;

        // 1. Tìm vị trí dựa trên ENUM TYPE (Không dùng String cứng nữa)
        // Hệ thống sẽ tìm kho nào được định nghĩa là STAGE_LOC
        Locations stageLocation = locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)
                .orElseThrow(() -> new RuntimeException("Lỗi: Không tìm thấy kho nào thuộc diện STAGE_LOC!"));

        for (InboundDetail detail : details) {
            // Chỉ nhập những dòng có số lượng thực tế > 0
            if (detail.getActualQty() > 0 && detail.getProduct() != null) {

                Long productId = detail.getProduct().getId();
                int qtyToAdd = detail.getActualQty();

                // 2. Tìm tồn kho cũ (nếu có) tại đúng vị trí kho chờ này
                Inventory inventory = inventoryRepo.findByProduct_IdAndLocation_Id(productId, stageLocation.getId())
                        .orElse(null);

                if (inventory != null) {
                    // CASE A: Đã có hàng ở đây -> Cộng dồn số lượng
                    inventory.setQuantity(inventory.getQuantity() + qtyToAdd);
                } else {
                    // CASE B: Chưa có -> Tạo mới
                    inventory = new Inventory();
                    inventory.setProduct(detail.getProduct());
                    inventory.setQuantity(qtyToAdd);

                    // Gán vị trí STAGE_LOC vừa tìm được
                    inventory.setLocation(stageLocation);

                    // ✅ YÊU CẦU CỦA BẠN: Set mặc định là hôm nay
                    inventory.setManufactureDate(LocalDate.now());
                    inventory.setExpiryDate(LocalDate.now());
                }

                // Lưu xuống DB
                inventoryRepo.save(inventory);
            }
        }
    }

    // --- HÀM DUYỆT ĐƠN CỦA BẠN (GIỮ NGUYÊN LOGIC, CHỈ REVIEW LẠI) ---
    @Override
    @Transactional
    public InboundNote approveInboundDifference(Long poId) {
        // 1. Lấy danh sách phiếu chờ duyệt
        List<InboundNote> pendingNotes = inboundNoteRepo.findByPurchaseOrderId(poId).stream()
                .filter(n -> n.getStatus() == InboundStatus.VERIFIED)
                .collect(Collectors.toList());

        if (pendingNotes.isEmpty()) {
            throw new RuntimeException("Không tìm thấy phiếu nhập nào cần duyệt cho PO: " + poId);
        }

        // 2. DUYỆT TỪNG PHIẾU
        for (InboundNote note : pendingNotes) {
            // A. Đổi trạng thái
            note.setStatus(InboundStatus.COMPLETED);
            note.setStaffSignature("Manager Approved Difference");

            // B. Cộng kho (GỌI HÀM LOGIC MỚI Ở DƯỚI)
            updateInventoryFromInbound(note.getInboundDetails());

            // C. Lưu phiếu
            inboundNoteRepo.save(note);
        }

        // 3. Đóng PO
        PurchaseOrder po = pendingNotes.get(0).getPurchaseOrder();
        po.setStatus(POStatus.COMPLETED);
        poRepo.save(po);

        return pendingNotes.get(pendingNotes.size() - 1);
    }
}