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
    private final IStocktakeShelfAssignmentRepository assignmentRepo;
    private final ILocationRepository locationRepo;

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
    // 16. KIỂM TRA LOCK
    // =================================================================
    @Override
    public boolean isLocationLocked(String locationCode) {
        // Tìm các session đang IN_PROGRESS
        List<StocktakeSession> activeSessions = sessionRepo.findByStatus(StocktakeStatus.IN_PROGRESS);

        for (StocktakeSession session : activeSessions) {
            String zonePrefix = session.getZoneCode() + "-";
            if (locationCode.startsWith(zonePrefix)) {
                return true;
            }
        }
        return false;
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

        // Tạo Session
        StocktakeSession session = StocktakeSession.builder()
            .code(generateSessionCode())
            .status(StocktakeStatus.DRAFT)
            .zoneCode(request.getZoneCode())
            .createdBy(manager)
            .build();

        StocktakeSession savedSession = sessionRepo.save(session);

        log.info("✅ [CREATE STOCKTAKE] Đã tạo phiên {} cho Zone {}",
            savedSession.getCode(), savedSession.getZoneCode());

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

        // B1 - Lock: Chuyển trạng thái session sang IN_PROGRESS
        session.setStatus(StocktakeStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        StocktakeSession savedSession = sessionRepo.save(session);

        // B2 - Tìm kiếm: Query lấy danh sách location_id từ bảng locations có code LIKE 'A-%'
        String prefix = savedSession.getZoneCode() + "-";
        List<Locations> locationsInZone = locationRepo.findByCodeStartingWith(prefix);

        // B3 - Tạo việc (Assignments)
        List<StocktakeShelfAssignment> assignments = locationsInZone.stream()
            .map(loc -> StocktakeShelfAssignment.builder()
                .session(savedSession)
                .location(loc)
                .status(AssignmentStatus.OPEN)
                .build())
            .collect(Collectors.toList());

        assignmentRepo.saveAll(assignments);

        log.info("🚀 [START STOCKTAKE] Phiên {} đã bắt đầu. Đã tạo {} việc đếm kệ.",
            savedSession.getCode(), assignments.size());

        return mapSessionToResponse(savedSession);
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

        if (session.getDetails() == null) return new ArrayList<>();

        return session.getDetails().stream()
            .map(detail -> StocktakeBlindCountResponse.builder()
                .detailId(detail.getId())
                .productId(detail.getProduct().getId())
                .productSku(detail.getProduct().getSku())
                .productName(detail.getProduct().getName())
                .productImage(detail.getProduct().getImage_url())
                .locationCode(detail.getLocation().getCode())
                .actualCountedQty(detail.getActualQty())
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

        detail.setActualQty(request.getActualQty());
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

        // Gọi Custom Query từ Repository
        List<StocktakeDetail> variances = detailRepo.findVariancesBySessionId(sessionId);

        List<VarianceItemResponse> varianceItems = variances.stream()
            .map(d -> {
                int initial = d.getInitialQty() != null ? d.getInitialQty() : 0;
                int actual = d.getActualQty() != null ? d.getActualQty() : 0;
                int variance = actual - initial;
                return VarianceItemResponse.builder()
                    .detailId(d.getId())
                    .productId(d.getProduct().getId())
                    .productSku(d.getProduct().getSku())
                    .productName(d.getProduct().getName())
                    .locationCode(d.getLocation().getCode())
                    .systemQty(initial)
                    .actualQty(actual)
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

        // Chốt sổ: Manager bấm nút "Hoàn tất đợt kiểm kê"
        // Hệ thống xử lý: Chạy vòng lặp qua tất cả các dòng trong stocktake_details.
        List<StocktakeDetail> allDetails = detailRepo.findBySessionId(session.getId());
        for (StocktakeDetail detail : allDetails) {
            // Nếu có chênh lệch (actual khác initial)
            if (detail.getActualQty() != null && !detail.getActualQty().equals(detail.getInitialQty())) {
                adjustInventory(detail, manager);
            }
        }

        session.setStatus(StocktakeStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());
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
        
        detail.setActualQty(null); // Reset để đếm lại
        detailRepo.save(detail);
    }

    // =================================================================
    // 13. LẤY DANH SÁCH VIỆC (ASSIGNMENTS)
    // =================================================================
    @Override
    public List<StocktakeShelfAssignmentResponse> getStaffAssignments(String username) {
        // Lấy tất cả các việc đang OPEN hoặc do chính staff này đang làm (IN_PROGRESS)
        // Đơn giản hóa: Trả về tất cả assignments của các session đang IN_PROGRESS
        List<StocktakeSession> activeSessions = sessionRepo.findByStatus(StocktakeStatus.IN_PROGRESS);

        List<StocktakeShelfAssignmentResponse> responses = new ArrayList<>();
        for (StocktakeSession session : activeSessions) {
            List<StocktakeShelfAssignment> assignments = assignmentRepo.findBySessionId(session.getId());
            for (StocktakeShelfAssignment ass : assignments) {
                responses.add(StocktakeShelfAssignmentResponse.builder()
                    .id(ass.getId())
                    .sessionId(session.getId())
                    .sessionCode(session.getCode())
                    .locationId(ass.getLocation().getId())
                    .locationCode(ass.getLocation().getCode())
                    .status(ass.getStatus().name())
                    .staffName(ass.getStaff() != null ? ass.getStaff().getFullName() : null)
                    .build());
            }
        }
        return responses;
    }

    // =================================================================
    // 14. BẮT ĐẦU ĐẾM MỘT KỆ (ASSIGNMENT)
    // =================================================================
    @Override
    @Transactional
    public List<StocktakeBlindCountResponse> startAssignment(String username, Long assignmentId) {
        User staff = userRepo.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User không tồn tại"));

        StocktakeShelfAssignment assignment = assignmentRepo.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy việc phân công"));

        if (assignment.getStatus() != AssignmentStatus.OPEN) {
            if (assignment.getStatus() == AssignmentStatus.IN_PROGRESS && assignment.getStaff().equals(staff)) {
                // Đã bắt đầu rồi, trả về list cũ
            } else {
                throw new RuntimeException("Kệ này đã có người khác nhận hoặc đã hoàn thành");
            }
        } else {
            // Chuyển trạng thái sang IN_PROGRESS
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
            assignment.setStaff(staff);
            assignment.setStartedAt(LocalDateTime.now());
            assignmentRepo.save(assignment);

            // Snapshot: Query bảng inventory tìm tất cả hàng đang có tại kệ này
            List<Inventory> inventories = inventoryRepo.findByLocation(assignment.getLocation());

            // INSERT vào bảng stocktake_details
            List<StocktakeDetail> details = inventories.stream()
                .map(inv -> StocktakeDetail.builder()
                    .session(assignment.getSession())
                    .assignment(assignment)
                    .product(inv.getProduct())
                    .location(inv.getLocation())
                    .initialQty(inv.getQuantity())
                    .actualQty(null) // Để null theo yêu cầu
                    .build())
                .collect(Collectors.toList());

            detailRepo.saveAll(details);
            assignment.setDetails(details);
        }

        // Trả danh sách về cho App
        return assignment.getDetails().stream()
            .map(detail -> StocktakeBlindCountResponse.builder()
                .detailId(detail.getId())
                .productId(detail.getProduct().getId())
                .productSku(detail.getProduct().getSku())
                .productName(detail.getProduct().getName())
                .productImage(detail.getProduct().getImage_url())
                .locationCode(detail.getLocation().getCode())
                .actualCountedQty(detail.getActualQty())
                .build())
            .collect(Collectors.toList());
    }

    // =================================================================
    // 15. HOÀN THÀNH KỆ
    // =================================================================
    @Override
    @Transactional
    public void completeAssignment(Long assignmentId) {
        StocktakeShelfAssignment assignment = assignmentRepo.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy việc phân công"));

        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setCompletedAt(LocalDateTime.now());
        assignmentRepo.save(assignment);
    }

    // =================================================================
    // HELPER METHODS
    // =================================================================

    private void adjustInventory(StocktakeDetail detail, User manager) {
        Inventory inventory = inventoryRepo.findByProductAndLocation(
                detail.getProduct(), 
                detail.getLocation()
            )
            .orElse(null);

        int oldQty = 0;
        if (inventory != null) {
            oldQty = inventory.getQuantity();
        } else {
            inventory = Inventory.builder()
                .product(detail.getProduct())
                .location(detail.getLocation())
                .build();
        }

        int newQty = detail.getActualQty() != null ? detail.getActualQty() : 0;
        int variance = newQty - oldQty;

        inventory.setQuantity(newQty);
        if (newQty == 0 && inventory.getId() != null) {
            inventoryRepo.delete(inventory);
        } else {
            inventoryRepo.save(inventory);
        }

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
        Integer initial = detail.getInitialQty();
        Integer actual = detail.getActualQty();
        Integer variance = (actual != null && initial != null) ? (actual - initial) : null;

        return StocktakeDetailResponse.builder()
            .id(detail.getId())
            .productId(detail.getProduct().getId())
            .productSku(detail.getProduct().getSku())
            .productName(detail.getProduct().getName())
            .productImage(detail.getProduct().getImage_url())
            .locationId(detail.getLocation().getId())
            .locationCode(detail.getLocation().getCode())
            .systemQtySnapshot(initial != null ? initial : 0)
            .actualCountedQty(actual)
            .variance(variance)
            .build();
    }

    private int getTotalItems(StocktakeSession session) {
        return session.getDetails() != null ? session.getDetails().size() : 0;
    }

    private int getCountedItems(StocktakeSession session) {
        if (session.getDetails() == null) return 0;
        return (int) session.getDetails().stream()
            .filter(d -> d.getActualQty() != null)
            .count();
    }

    private int getVarianceCount(StocktakeSession session) {
        if (session.getDetails() == null) return 0;
        return (int) session.getDetails().stream()
            .filter(d -> d.getActualQty() != null)
            .filter(d -> !d.getActualQty().equals(d.getInitialQty()))
            .count();
    }
}