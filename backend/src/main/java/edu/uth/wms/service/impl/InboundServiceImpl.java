package edu.uth.wms.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet; // 👈 Đảm bảo đã import Exception này
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.response.InboundDetailResponse;
import edu.uth.wms.dto.response.InboundNoteResponse;
import edu.uth.wms.dto.response.InboundResultDetail;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.exceptions.InboundValidationException;
import edu.uth.wms.exceptions.ResourceNotFoundException;
import edu.uth.wms.model.InboundDetail;
import edu.uth.wms.model.InboundNote;
import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.InventoryTransaction;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.PODetail;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.PurchaseOrder;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.POStatus;
import edu.uth.wms.model.enums.TransactionType;
import edu.uth.wms.repository.IIboundDetailRepository;
import edu.uth.wms.repository.IInboundNoteRepository;
import edu.uth.wms.repository.IInventoryRepository;
import edu.uth.wms.repository.ILocationRepository;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.repository.ITransactionRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.IInboundService;
import edu.uth.wms.service.IStocktakeService;
import edu.uth.wms.service.utils.SecurityUtils;
import static edu.uth.wms.service.utils.SecurityUtils.getCurrentUserLogin;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class InboundServiceImpl implements IInboundService {

    private final IPurchaseOrderRepository poRepo;
    private final IInboundNoteRepository inboundNoteRepo;
    private final IProductRepository productRepo;
    private final IInventoryRepository inventoryRepo;
    private final ILocationRepository locationRepo;
    private final IUserRepository userRepository;
    private final ITransactionRepository transactionRepo;
    private final IStocktakeService stocktakeService;

    @Override
    @Transactional
    public InboundNote processInboundResult(Long poId, List<InboundSubmitRequest> actualItems) {

        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng PO: " + poId));

        if (po.getStatus() == POStatus.COMPLETED) {
            throw new BadRequestException("Đơn hàng này đã hoàn thành");
        } else if (po.getStatus() == POStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng này đã bị hủy");
        }

        InboundNote note = inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập kho Nháp cho PO này!"));

        if (!(note.getProcessedBy().getUsername().equals(getCurrentUserLogin()))) {
            throw new AccessDeniedException("Bạn ko có quyền để gửi phiếu này!");
        }


        Map<Long, PODetail> expectedMap = po.getDetails().stream()
                .collect(Collectors.toMap(d -> d.getProduct().getId(), d -> d));

        Set<Long> submittedProductIds = new HashSet<>();
        List<InboundResultDetail> errorDetails = new ArrayList<>();

        for (InboundSubmitRequest item : actualItems) {
            Long staffProductId = item.getProductId();
            int actualQty = item.getActualQty();

            submittedProductIds.add(staffProductId);

            boolean isItemValid = true;
            String message = "OK";

            String currentProductName = "Unknown Product";
            String currentSku = "Unknown SKU";

            // Sản phẩm có trong PO không?
            if (!expectedMap.containsKey(staffProductId)) {
                isItemValid = false;
                message = "Sản phẩm không có trong đơn hàng (PO) này";

                Products strangeProduct = productRepo.findById(staffProductId).orElse(null);
                if (strangeProduct != null) {
                    currentProductName = strangeProduct.getName();
                    currentSku = strangeProduct.getSku();
                }
            }
            // Số lượng có khớp không?
            else {
                PODetail expectedDetail = expectedMap.get(staffProductId);

                currentProductName = expectedDetail.getProduct().getName();
                currentSku = expectedDetail.getProduct().getSku();

                if (actualQty != expectedDetail.getExpectedQty()) {
                    isItemValid = false;
                    message = String.format("Sai số lượng!");
                }
            }

            if (!isItemValid) {
                errorDetails.add(InboundResultDetail.builder().productId(String.valueOf(staffProductId))
                        .productName(currentProductName).sku(currentSku).isValid(false) // Chắc chắn là false
                        .message(message).build());
            }

        }
        for (Map.Entry<Long, PODetail> entry : expectedMap.entrySet()) {
            Long expectedProductId = entry.getKey();
            PODetail expectedDetail = entry.getValue();

            if (!submittedProductIds.contains(expectedProductId)) {
                errorDetails.add(InboundResultDetail.builder().productId(String.valueOf(expectedProductId))
                        .productName(expectedDetail.getProduct().getName()).sku(expectedDetail.getProduct().getSku())
                        .isValid(false).message("Sản phẩm bị thiếu, vui lòng nhập đủ các dòng hàng trong PO").build());
            }
        }

        if (!errorDetails.isEmpty()) {
            throw new InboundValidationException("Dữ liệu nhập kho không khớp với PO", errorDetails);
        }

        note.setReceivedDate(LocalDateTime.now());
        note.setStatus(InboundStatus.COMPLETED);

        List<InboundDetail> currentDetails = note.getInboundDetails();
        if (currentDetails == null) {
            currentDetails = new ArrayList<>();
            note.setInboundDetails(currentDetails);
        }

        currentDetails.clear();

        for (InboundSubmitRequest item : actualItems) {
            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(productRepo.findById(item.getProductId()).orElseThrow(
                    () -> new ResourceNotFoundException("Khồng tìm thấy sản phẩm với ID: " + item.getProductId())));

            detail.setActualQty(item.getActualQty());
            detail.setNote("Nhập đủ hàng");

            currentDetails.add(detail);
        }

        InboundNote savedNote = inboundNoteRepo.save(note);

        updateInventoryFromInbound(savedNote.getInboundDetails());

        po.setStatus(POStatus.COMPLETED);

        poRepo.save(po);

        return savedNote;
    }

    private void updateInventoryFromInbound(List<InboundDetail> details) {
        if (details == null || details.isEmpty())
            return;

        Locations stageLocation = locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)
                .orElseThrow(() -> new ResourceNotFoundException("Lỗi: Không tìm thấy kho nào thuộc diện STAGE_LOC!"));

        if (stocktakeService.isLocationLocked(stageLocation.getCode())) {
            throw new BadRequestException("Vị trí STAGE " + stageLocation.getCode() + " đang bị khóa để kiểm kê!");
        }
        
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
                Inventory savedInventory = inventoryRepo.save(inventory);
                User user = userRepository.findByUsername(SecurityUtils.getCurrentUserLogin())
                        .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user!"));

                logTransaction(TransactionType.INBOUND_STAGE,
                        detail.getProduct(),
                        qtyToAdd,
                        stageLocation,
                        user,
                        savedInventory,
                        detail.getInboundNote().getNoteNumber()
                );
            }
        }
    }

    private void logTransaction(TransactionType type, Products product, Integer qtyChanged, Locations locationRef,
            User user, Inventory destInventory, String codeNote) {

        int qtyAfter = destInventory.getQuantity();
        int qtyBefore = qtyAfter - qtyChanged;

        InventoryTransaction trans = InventoryTransaction.builder().type(type).product(product).location(locationRef)
                .performedBy(user).quantityChanged(qtyChanged).quantityAfter(qtyAfter)
                .quantityBefore(qtyBefore)
                .referenceDocId(codeNote)
                .build();

        transactionRepo.save(trans);
    }

    @Override
    @Transactional
    public InboundNote approveInboundDifference(Long poId) {
        List<InboundNote> pendingNotes = inboundNoteRepo.findByPurchaseOrderId(poId).stream()
                .filter(n -> n.getStatus() == InboundStatus.VERIFYING).collect(Collectors.toList());

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
    public InboundNoteResponse cancelInboundNote(Long inboundId) {

        InboundNote note = inboundNoteRepo.findById(inboundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập ID: " + inboundId));
        User manager = userRepository.findByUsername(getCurrentUserLogin())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user đang đăng nhập"));
        Boolean isManager = false;
        if (!manager.getRole().equals("MANAGER")) {
            isManager = true;
        }

        if (!note.getProcessedBy().getUsername().equals(getCurrentUserLogin()) && !isManager) {
            throw new AccessDeniedException("Bạn không có quyền hủy phiếu nhập của người khác!");
        }

        if (note.getStatus() != InboundStatus.DRAFT) {
            throw new BadRequestException("Chỉ có thể hủy phiếu nhập đang ở trạng thái NHÁP (DRAFT). ");
        }

        // 3. Xử lý logic Hủy
        // 3.1. Hủy phiếu nhập
        note.setStatus(InboundStatus.CANCELLED);

        // 3.2. QUAN TRỌNG: Revert PO về trạng thái NEW
        // Lý do: Hủy phiếu nhập nháp nghĩa là user muốn làm lại từ đầu hoặc không nhập
        // nữa,
        // trả PO về NEW để có thể tạo phiếu nhập mới sau này.
        PurchaseOrder po = note.getPurchaseOrder();
        po.setStatus(POStatus.NEW);
        poRepo.save(po);

        InboundNote savedNote = inboundNoteRepo.save(note);
        return toDto(savedNote);
    }

    @Transactional
    @Override
    public InboundNoteResponse createInboundNote(Long poId) {
        String username = getCurrentUserLogin();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy user!"));

        PurchaseOrder purchaseOrder = poRepo.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn mua hàng!"));


        if (purchaseOrder.getStatus() != POStatus.NEW) {
            throw new BadRequestException("Đơn hàng này đã được tạo phiếu nhập!");
        }

        boolean hasDraft = inboundNoteRepo.existsByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT);
        if (hasDraft) {
            throw new DataIntegrityViolationException(
                    "Đơn hàng này đang có một phiếu nhập nháp (Draft) chưa hoàn thành. Vui lòng xử lý phiếu cũ trước!");
        }


        if (purchaseOrder.getStatus() != POStatus.RECEIVING) {
            purchaseOrder.setStatus(POStatus.RECEIVING);
            poRepo.save(purchaseOrder);
        }


        InboundNote inboundNote = new InboundNote();
        inboundNote.setStatus(InboundStatus.DRAFT);
        inboundNote.setNoteNumber("IBN" + System.currentTimeMillis());
        inboundNote.setProcessedBy(user);
        inboundNote.setPurchaseOrder(purchaseOrder);

        InboundNote savedInboundNote = inboundNoteRepo.save(inboundNote);
        return toDto(savedInboundNote);
    }

    @Override
    public List<InboundNoteResponse> getMyInboundNotes() {
        String currentUsername = SecurityUtils.getCurrentUserLogin();

        if (currentUsername == null) {
            throw new BadRequestException("Không xác định được người dùng hiện tại.");
        }

        List<InboundNote> myNotes = inboundNoteRepo.findByProcessedBy_UsernameOrderByReceivedDateDesc(currentUsername);

        return myNotes.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public InboundNoteResponse submitIbnoteReport(Long poId, List<InboundSubmitRequest> actualItems) {
        PurchaseOrder po = poRepo.findById(poId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng PO: " + poId));

        if (po.getStatus() == POStatus.COMPLETED) {
            throw new BadRequestException("Đơn hàng này đã hoàn thành");
        } else if (po.getStatus() == POStatus.CANCELLED) {
            throw new BadRequestException("Đơn hàng này đã bị hủy");
        }

        InboundNote note = inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT)
                .orElseThrow(() -> new ResourceNotFoundException("Phiếu nhập kho không hợp lệ hoặc đã được xử lý!"));

        if (!note.getProcessedBy().getUsername().equals(getCurrentUserLogin())) {
            throw new AccessDeniedException("Bạn không có quyền báo cáo phiếu này!");
        }

        Map<Long, Integer> expectedMap = po.getDetails().stream()
                .collect(Collectors.toMap(d -> d.getProduct().getId(), PODetail::getExpectedQty));

        List<InboundDetail> reportDetails = new ArrayList<>();

        Set<Long> scannedProductIds = new HashSet<>();

        // --- DUYỆT QUA CÁC SẢN PHẨM NHÂN VIÊN GỬI LÊN ---
        for (InboundSubmitRequest item : actualItems) {
            Long productId = item.getProductId();
            int actualQty = item.getActualQty();
            scannedProductIds.add(productId);

            InboundDetail detail = new InboundDetail();
            detail.setInboundNote(note);
            detail.setProduct(productRepo.findById(productId)
                    .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + productId)));
            detail.setActualQty(actualQty);

            if (expectedMap.containsKey(productId)) {
                int expectedQty = expectedMap.get(productId);
                int diff = expectedQty - actualQty;

                if (diff > 0) {
                    detail.setNote("Thiếu hàng: thiếu " + diff + " cái");
                } else if (diff < 0) {
                    detail.setNote("Thừa hàng: thừa " + Math.abs(diff) + " cái");
                } else {
                    detail.setNote("Đủ hàng");
                }
            } else {
                detail.setNote("Sản phẩm ngoài đơn hàng (PO)");
            }

            reportDetails.add(detail);
        }

        // ---DUYỆT QUA CÁC SẢN PHẨM CÓ TRONG PO NHƯNG KHÔNG ĐƯỢC GỬI LÊN
        for (Map.Entry<Long, Integer> entry : expectedMap.entrySet()) {
            Long expectedId = entry.getKey();
            Integer expectedQty = entry.getValue();

            if (!scannedProductIds.contains(expectedId)) {
                InboundDetail missingDetail = new InboundDetail();
                missingDetail.setInboundNote(note);
                missingDetail.setProduct(productRepo.findById(expectedId).orElse(null));
                missingDetail.setActualQty(0);

                missingDetail.setNote("Thiếu hàng: thiếu " + expectedQty + " cái");

                reportDetails.add(missingDetail);
            }
        }

        if (note.getInboundDetails() != null) {
            note.getInboundDetails().clear();
            note.getInboundDetails().addAll(reportDetails);
        } else {
            note.setInboundDetails(reportDetails);
        }

        note.setStatus(InboundStatus.VERIFYING);
        note.setReceivedDate(LocalDateTime.now());

        InboundNote savedInboundNote = inboundNoteRepo.save(note);
        return toDto(savedInboundNote);
    }

    @Override
    @Transactional
    public InboundNoteResponse approveInboundNote(Long inboundId) {
        InboundNote note = inboundNoteRepo.findById(inboundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập: " + inboundId));

        if (note.getStatus() != InboundStatus.VERIFYING) {
            throw new BadRequestException(
                    "Chỉ được duyệt phiếu đang ở trạng thái Chờ duyệt (VERIFYING). Status hiện tại: "
                            + note.getStatus());
        }

        PurchaseOrder po = note.getPurchaseOrder();

        updateInventoryFromInbound(note.getInboundDetails());

        note.setStatus(InboundStatus.COMPLETED);
        note.setReceivedDate(LocalDateTime.now());

        po.setStatus(POStatus.COMPLETED);

        poRepo.save(po);
        InboundNote updatedInboundNote = inboundNoteRepo.save(note);
        return toDto(updatedInboundNote);
    }

    @Override
    @Transactional
    public InboundNoteResponse rejectInboundNote(Long inboundId) {
        InboundNote note = inboundNoteRepo.findById(inboundId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phiếu nhập: " + inboundId));

        if (note.getStatus() != InboundStatus.VERIFYING) {
            throw new BadRequestException(
                    "Chỉ được từ chối phiếu đang ở trạng thái Chờ duyệt (VERIFYING). Status hiện tại: "
                            + note.getStatus());
        }

        PurchaseOrder po = note.getPurchaseOrder();

        note.setStatus(InboundStatus.CANCELLED);

        po.setStatus(POStatus.CANCELLED);

        poRepo.save(po);
        InboundNote updatedInboundNote = inboundNoteRepo.save(note);
        return toDto(updatedInboundNote);
    }

    @Override
    public List<InboundNoteResponse> getAlls() {
        return inboundNoteRepo.findAll().stream().map(inboundNote -> toDto(inboundNote)).collect(Collectors.toList());
    }

    private InboundNoteResponse toDto(InboundNote inboundNote) {
        List<InboundDetailResponse> detailsDto = new ArrayList<>();
        if (inboundNote.getInboundDetails() != null && !inboundNote.getInboundDetails().isEmpty()) {
            detailsDto = inboundNote.getInboundDetails().stream()
                    .map(d -> InboundDetailResponse.builder()
                            .id(d.getId())
                            .productId(d.getProduct().getId())
                            .productName(d.getProduct().getName())
                            .productSku(d.getProduct().getSku())
                            .actualQty(d.getActualQty())
                            .note(d.getNote())

                            .build())
                    .collect(Collectors.toList());
        }
        return InboundNoteResponse.builder().id(inboundNote.getId())
                .purchaseOrderId(inboundNote.getPurchaseOrder().getId())
                .poNumber(inboundNote.getPurchaseOrder().getPoNumber())
                .processedBy(
                        inboundNote.getProcessedBy() != null ? inboundNote.getProcessedBy().getUsername() : "System")
                .status(inboundNote.getStatus()).receivedDate(inboundNote.getReceivedDate())
                .noteNumber(inboundNote.getNoteNumber())

                .inboundDetails(detailsDto != null ? detailsDto : List.of()).build();
    }

}