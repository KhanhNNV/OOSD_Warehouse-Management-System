package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.IStocktakeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * SERVICE IMPL - KIỂM KÊ KHO
 * Đã cập nhật để tương thích với Entity StocktakeSession (Không có Zone/Category)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StocktakeServiceImpl implements IStocktakeService {

    private final IStocktakeSessionRepository sessionRepo;
    private final IStocktakeDetailRepository detailRepo;
    private final IInventoryRepository inventoryRepo;
    private final IUserRepository userRepo;
    private final ITransactionRepository transactionRepo;

    // =================================================================
    // 1. LẤY TẤT CẢ PHIÊN KIỂM KÊ
    // =================================================================
    @Override
    public List<StocktakeSessionResponse> getAllSessions() {
        return sessionRepo.findAll().stream()
            .map(this::mapSessionToResponse)
            .collect(Collectors.toList());
    }

    // =================================================================
    // 2. LẤY CHI TIẾT PHIÊN
    // =================================================================
    @Override
    public StocktakeSessionDetailResponse getSessionDetail(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê với ID: " + sessionId));

        List<StocktakeDetailResponse> details = session.getDetails().stream()
            .map(this::mapDetailToResponse)
            .collect(Collectors.toList());

        return StocktakeSessionDetailResponse.builder()
            .id(session.getId())
            .code(session.getCode())
            .status(session.getStatus().name())
            .totalItems(getTotalItems(session))
            .countedItems(getCountedItems(session))
            .varianceCount(getVarianceCount(session))
            .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
            .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
            .details(details)
            .build();
    }

    // =================================================================
    // 3. TẠO PHIÊN KIỂM KÊ MỚI
    // =================================================================
    @Override
    @Transactional
    public StocktakeSessionResponse createSession(String username, CreateStocktakeRequest request) {
        log.info("📋 [CREATE STOCKTAKE] Manager {} đang tạo phiên kiểm mới", username);

        User manager = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User không tồn tại: " + username));

        // Tạo Session (Lưu ý: Không set Zone vào Session vì Entity đã bỏ field này)
        StocktakeSession session = StocktakeSession.builder()
            .code(generateSessionCode())
            .status(StocktakeStatus.DRAFT)
            .createdBy(manager)
            .build();

        StocktakeSession savedSession = sessionRepo.save(session);

        // Tạo danh sách chi tiết (Lọc Inventory dựa trên Request)
        List<StocktakeDetail> details = generateStocktakeDetails(savedSession, request);
        
        if (details.isEmpty()) {
            throw new RuntimeException("Không tìm thấy sản phẩm nào phù hợp với điều kiện lọc (Zone/Category) để kiểm kê.");
        }

        detailRepo.saveAll(details);

        log.info("✅ [CREATE STOCKTAKE] Đã tạo phiên {} với {} sản phẩm", 
            savedSession.getCode(), details.size());

        return mapSessionToResponse(savedSession);
    }

    // =================================================================
    // 4. XÓA PHIÊN
    // =================================================================
    @Override
    @Transactional
    public void deleteSession(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        if (session.getStatus() != StocktakeStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể xóa phiên ở trạng thái DRAFT");
        }

        sessionRepo.delete(session);
        log.info("🗑️ [DELETE STOCKTAKE] Đã xóa phiên {}", session.getCode());
    }

    // =================================================================
    // 5. MỞ PHIÊN
    // =================================================================
    @Override
    @Transactional
    public StocktakeSessionResponse openSession(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        if (session.getStatus() != StocktakeStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể mở phiên ở trạng thái DRAFT");
        }

        session.setStatus(StocktakeStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());

        return mapSessionToResponse(sessionRepo.save(session));
    }

    // =================================================================
    // 6. ĐÓNG PHIÊN
    // =================================================================
    @Override
    @Transactional
    public StocktakeSessionResponse closeSession(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        if (session.getStatus() != StocktakeStatus.IN_PROGRESS) {
            throw new RuntimeException("Chỉ có thể đóng phiên đang IN_PROGRESS");
        }

        session.setStatus(StocktakeStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        return mapSessionToResponse(sessionRepo.save(session));
    }

    // =================================================================
    // 7. LẤY DANH SÁCH BLIND COUNT
    // =================================================================
    @Override
    public List<StocktakeBlindCountResponse> getBlindCountList(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        return session.getDetails().stream()
            .map(detail -> StocktakeBlindCountResponse.builder()
                .detailId(detail.getId())
                .productId(detail.getProduct().getId())
                .productSku(detail.getProduct().getSku())
                .productName(detail.getProduct().getName())
                .productImage(detail.getProduct().getImage_url()) // Chú ý: Đảm bảo Getter đúng tên trong Product Entity
                .locationCode(detail.getLocation().getCode())
                // Nếu = 0 (chưa đếm) thì trả về null để FE hiển thị ô trống
                .actualCountedQty(detail.getActualCountedQty() != 0 ? detail.getActualCountedQty() : null)
                .build())
            .collect(Collectors.toList());
    }

    // =================================================================
    // 8. STAFF NHẬP SỐ LƯỢNG
    // =================================================================
    @Override
    @Transactional
    public StocktakeDetailResponse submitCount(String username, CountStocktakeItemRequest request) {
        // Validate user tồn tại
        if (!userRepo.existsByUsername(username)) {
            throw new RuntimeException("User không tồn tại: " + username);
        }

        StocktakeDetail detail = detailRepo.findById(request.getDetailId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết kiểm kê"));

        detail.setActualCountedQty(request.getActualQty());
        detailRepo.save(detail);

        return mapDetailToResponse(detail);
    }

    // =================================================================
    // 9. SUBMIT NHIỀU SẢN PHẨM
    // =================================================================
    @Override
    @Transactional
    public List<StocktakeDetailResponse> submitCounts(String username, SubmitCountsRequest request) {
        List<StocktakeDetailResponse> results = new ArrayList<>();
        for (CountStocktakeItemRequest count : request.getCounts()) {
            results.add(submitCount(username, count));
        }
        return results;
    }

    // =================================================================
    // 10. LẤY BÁO CÁO CHÊNH LỆCH
    // =================================================================
    @Override
    public VarianceReportResponse getVarianceReport(Long sessionId) {
        StocktakeSession session = sessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        // Gọi Custom Query từ Repository (Cần đảm bảo Repo có hàm này)
        List<StocktakeDetail> variances = detailRepo.findVariancesBySessionId(sessionId);

        List<VarianceItemResponse> varianceItems = variances.stream()
            .map(d -> {
                int variance = d.getActualCountedQty() - d.getSystemQtySnapshot();
                return VarianceItemResponse.builder()
                    .detailId(d.getId())
                    .productId(d.getProduct().getId())
                    .productSku(d.getProduct().getSku())
                    .productName(d.getProduct().getName())
                    .locationCode(d.getLocation().getCode())
                    .systemQty(d.getSystemQtySnapshot())
                    .actualQty(d.getActualCountedQty())
                    .variance(variance)
                    .build();
            })
            .collect(Collectors.toList());

        int totalShortage = varianceItems.stream()
            .filter(v -> v.getVariance() < 0)
            .mapToInt(v -> Math.abs(v.getVariance()))
            .sum();

        int totalOverage = varianceItems.stream()
            .filter(v -> v.getVariance() > 0)
            .mapToInt(VarianceItemResponse::getVariance)
            .sum();

        return VarianceReportResponse.builder()
            .sessionId(session.getId())
            .sessionCode(session.getCode())
            .variances(varianceItems)
            .totalVarianceItems(varianceItems.size())
            .totalShortage(totalShortage)
            .totalOverage(totalOverage)
            .build();
    }

    // =================================================================
    // 11. APPROVE ADJUSTMENT
    // =================================================================
    @Override
    @Transactional
    public StocktakeSessionResponse approveAdjustment(String username, ApproveAdjustmentRequest request) {
        User manager = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        StocktakeSession session = sessionRepo.findById(request.getSessionId())
            .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));

        if (session.getStatus() != StocktakeStatus.COMPLETED) {
            throw new RuntimeException("Chỉ có thể duyệt phiên đã COMPLETED");
        }

        List<StocktakeDetail> variances = detailRepo.findVariancesBySessionId(session.getId());
        for (StocktakeDetail detail : variances) {
            adjustInventory(detail, manager);
        }

        session.setStatus(StocktakeStatus.ADJUSTED);
        return mapSessionToResponse(sessionRepo.save(session));
    }

    // =================================================================
    // 12. YÊU CẦU KIỂM LẠI
    // =================================================================
    @Override
    @Transactional
    public void requestRecount(Long detailId, String notes) {
        StocktakeDetail detail = detailRepo.findById(detailId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết"));
        
        detail.setActualCountedQty(0); // Reset để đếm lại
        detailRepo.save(detail);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private List<StocktakeDetail> generateStocktakeDetails(StocktakeSession session, CreateStocktakeRequest request) {
        // [FIX] Thêm filter null an toàn hơn khi lọc Product/Category
        List<Inventory> inventories = inventoryRepo.findAll().stream()
            .filter(inv -> inv.getQuantity() > 0) // Chỉ lấy hàng có tồn > 0
            .filter(inv -> {
                if ("ZONE".equals(request.getType())) {
                    return inv.getLocation() != null && 
                           inv.getLocation().getCode() != null &&
                           inv.getLocation().getCode().startsWith(request.getZoneCode());
                } else if ("CATEGORY".equals(request.getType())) {
                    return inv.getProduct() != null && 
                           inv.getProduct().getCategory() != null &&
                           inv.getProduct().getCategory().getId().equals(request.getCategoryId());
                }
                return true; // Nếu type = ALL thì lấy hết
            })
            .collect(Collectors.toList());

        return inventories.stream()
            .map(inv -> StocktakeDetail.builder()
                .session(session)
                .product(inv.getProduct())
                .location(inv.getLocation())
                .systemQtySnapshot(inv.getQuantity())
                .actualCountedQty(0)
                .build())
            .collect(Collectors.toList());
    }

    private void adjustInventory(StocktakeDetail detail, User manager) {
        Inventory inventory = inventoryRepo.findByProductAndLocation(
                detail.getProduct(), 
                detail.getLocation()
            )
            .orElseThrow(() -> new RuntimeException("Không tìm thấy inventory cho sản phẩm: " + detail.getProduct().getSku()));

        int oldQty = inventory.getQuantity();
        int newQty = detail.getActualCountedQty();
        int variance = newQty - oldQty;

        inventory.setQuantity(newQty);
        inventoryRepo.save(inventory);

        InventoryTransaction transaction = InventoryTransaction.builder()
            .type(TransactionType.STOCKTAKE_ADJUST)
            .product(detail.getProduct())
            .location(detail.getLocation())
            .quantityBefore(oldQty)
            .quantityChanged(Math.abs(variance))
            .quantityAfter(newQty)
            .performedBy(manager)
            .referenceDocId(detail.getSession().getCode())
            .build();

        transactionRepo.save(transaction);
    }

    private String generateSessionCode() {
        return "ST-" + System.currentTimeMillis();
    }

    private StocktakeSessionResponse mapSessionToResponse(StocktakeSession session) {
        return StocktakeSessionResponse.builder()
            .id(session.getId())
            .code(session.getCode())
            .status(session.getStatus().name())
            .totalItems(getTotalItems(session))
            .countedItems(getCountedItems(session))
            .varianceCount(getVarianceCount(session))
            .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
            .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
            .createdBy(session.getCreatedBy() != null ? session.getCreatedBy().getUsername() : null)
            .build();
    }

    private StocktakeDetailResponse mapDetailToResponse(StocktakeDetail detail) {
        int variance = detail.getActualCountedQty() - detail.getSystemQtySnapshot();
        return StocktakeDetailResponse.builder()
            .id(detail.getId())
            .productId(detail.getProduct().getId())
            .productSku(detail.getProduct().getSku())
            .productName(detail.getProduct().getName())
            .productImage(detail.getProduct().getImage_url())
            .locationId(detail.getLocation().getId())
            .locationCode(detail.getLocation().getCode())
            .systemQtySnapshot(detail.getSystemQtySnapshot())
            .actualCountedQty(detail.getActualCountedQty() != 0 ? detail.getActualCountedQty() : null)
            .variance(detail.getActualCountedQty() != 0 ? variance : null)
            .build();
    }

    private int getTotalItems(StocktakeSession session) {
        return session.getDetails() != null ? session.getDetails().size() : 0;
    }

    private int getCountedItems(StocktakeSession session) {
        if (session.getDetails() == null) return 0;
        return (int) session.getDetails().stream()
            .filter(d -> d.getActualCountedQty() != 0)
            .count();
    }

    private int getVarianceCount(StocktakeSession session) {
        if (session.getDetails() == null) return 0;
        return (int) session.getDetails().stream()
            .filter(d -> d.getActualCountedQty() != 0)
            .filter(d -> d.getActualCountedQty() != d.getSystemQtySnapshot())
            .count();
    }
}