package edu.uth.wms.service.impl;

import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.exceptions.BadRequestException;
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
import java.util.stream.Collector;
import java.util.stream.Collectors;

/**
 * SERVICE IMPL - KIỂM KÊ KHO
 * Đã cập nhật để tương thích với Entity StocktakeSession (Không có
 * Zone/Category)
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
    private final IProductRepository productRepository;
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
    // 2. LẤY CHI TIẾT PHIÊN
    // =================================================================
    @Override
    public StocktakeSessionDetailResponse getSessionDetail(Long sessionId) {
        StocktakeSession session = getSessionById(sessionId);

        List<StocktakeDetail> allDetails = getAllDetailsInSession(session);

        // Map từ Entity sang DTO
        List<StocktakeDetailResponse> detailResponses = allDetails.stream()
                .map(this::mapDetailToResponse) 
                .collect(Collectors.toList());

        return StocktakeSessionDetailResponse.builder()
                .id(session.getId())
                .code(session.getCode())
                .status(session.getStatus().name())
                .totalItems(getTotalItems(allDetails))
                .countedItems(getCountedItems(allDetails))
                .varianceCount(getVarianceCount(allDetails))
                .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
                .details(detailResponses)
                .build();
    }

    // =================================================================
    // 3. TẠO PHIÊN KIỂM KÊ MỚI
    // =================================================================
    @Override
    @Transactional
    public StocktakeSessionResponse createSession(String username, CreateStocktakeRequest request) {
        log.info("📋 [CREATE STOCKTAKE] Manager {} đang tạo phiên kiểm mới", username);

        // Lấy thông tin của Manager
        User manager = getUserEntity(username);

        // Tạo Session
        StocktakeSession session = StocktakeSession.builder()
                .code(generateSessionCode())
                .status(StocktakeStatus.DRAFT)
                .zoneCode(request.getZoneCode())
                .createdBy(manager)
                .build();

        session = sessionRepo.save(session);

        // Tìm tất cả location trong zone đó và lọc các location valid chứa hàng
        List<Locations> validLocations = findValidLocationsByZoneCode(request.getZoneCode());

        // Tạo các phiếu task theo từng location: 
        // VD: phiếu A -> locations(A-01-01),phiếu B -> locations(A-01-02),...
        createAssignments(session, validLocations);

        log.info("✅ [CREATE STOCKTAKE] Đã tạo phiên {} cho Zone {}",
                session.getCode(), session.getZoneCode());

        return mapSessionToResponse(session);
    }

    // =================================================================
    // 4. XÓA PHIÊN KHI PHIẾU CÒN DRAF XÓA CỨNG
    // =================================================================
    @Override
    @Transactional
    public void deleteSession(Long sessionId) {
        StocktakeSession session = getSessionById(sessionId);
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
        StocktakeSession session = getSessionById(sessionId);
        
        // Kiểm tra trạng thái phiên
        if (session.getStatus() != StocktakeStatus.DRAFT) {
            throw new RuntimeException("Chỉ có thể mở phiên ở trạng thái DRAFT");
        }

        // Chuyển trạng thái session sang IN_PROGRESS
        session.setStatus(StocktakeStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());
        StocktakeSession savedSession = sessionRepo.save(session);

        // Chuyển trạng thái assignment sang OPEN
        List<StocktakeShelfAssignment> assignments = assignmentRepo.findBySessionId(sessionId);
        for (StocktakeShelfAssignment assignment : assignments){
            assignment.setStatus(AssignmentStatus.OPEN);
        }

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
        StocktakeSession session = getSessionById(sessionId);
        
        // Kiểm tra trạng thái phiên
        if (session.getStatus() != StocktakeStatus.IN_PROGRESS) {
            throw new RuntimeException("Chỉ có thể đóng phiên đang IN_PROGRESS");
        }

        session.setStatus(StocktakeStatus.COMPLETED);
        session.setCompletedAt(LocalDateTime.now());

        return mapSessionToResponse(sessionRepo.save(session));
    }

    // =================================================================
    // 10. LẤY BÁO CÁO CHÊNH LỆCH
    // =================================================================
    @Override
    public VarianceReportResponse getVarianceReport(Long sessionId) {
        StocktakeSession session =getSessionById(sessionId);

        // Gọi Custom Query từ Repository (Cần đảm bảo Repo có hàm này)
        List<StocktakeDetail> allDetails = getAllDetailsInSession(session) ;

        List<VarianceItemResponse> varianceItems = allDetails.stream()
                .filter(this::isVariance)
                .map(this::mapVarianceItem)
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
        User manager = getUserEntity(username);

        StocktakeSession session = getSessionById(request.getSessionId());
        // Chốt sổ: Manager bấm nút "Hoàn tất đợt kiểm kê"
        // Hệ thống xử lý: Chạy vòng lặp qua tất cả các dòng trong stocktake_details.
        List<StocktakeDetail> allDetails = detailRepo.findBySessionId(session.getId());
        
        for (StocktakeDetail detail : allDetails) {
            // Nếu có chênh lệch (actual khác initial)
            if (isVariance(detail)) {
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

        detail.setActualCountedQty(0); // Reset để đếm lại
        detailRepo.save(detail);
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
    // 13. LẤY DANH SÁCH VIỆC ĐANG CHỜ (OPEN) || ĐANG THỰC HIỆN (IN_PROGRESS) BỞI STAFF ĐÓ
    // =================================================================
    @Override
    public List<StocktakeShelfAssignmentResponse> getStaffAssignments(String username) {

        // Chỉ lấy các Session đang diễn ra
        List<StocktakeSession> activeSessions = sessionRepo.findByStatus(StocktakeStatus.IN_PROGRESS);
        List<StocktakeShelfAssignmentResponse> responses = new ArrayList<>();

        for (StocktakeSession session : activeSessions) {
            // Lấy tất cả nhiệm vụ trong phiên session
            List<StocktakeShelfAssignment> assignments = assignmentRepo.findBySessionId(session.getId());
            for (StocktakeShelfAssignment ass : assignments) {
                boolean isMyTask = ass.getStaff() != null && ass.getStaff().getUsername().equals(username);
                if (ass.getStatus() == AssignmentStatus.OPEN ||
                        (ass.getStatus() == AssignmentStatus.IN_PROGRESS && isMyTask)) {
                    responses.add(StocktakeShelfAssignmentResponse.builder()
                            .id(ass.getId())
                            .sessionId(session.getId())
                            .sessionCode(session.getCode())
                            .locationCode(ass.getLocation().getCode()) // Hiển thị tên kệ: A-01-01
                            .status(ass.getStatus())
                            .staffName(ass.getStaff() != null ? ass.getStaff().getFullName() : null)
                            .startedAt(ass.getStartedAt())
                            .build());
                }
            }
        }
        return responses;
    }

    // =================================================================
    /**
     * 14. BẮT ĐẦU ĐẾM MỘT KỆ (ASSIGNMENT)
     */
    // =================================================================
    @Override
    @Transactional
    public List<StocktakeBlindCountResponse> startAssignment(String username, Long assignmentId) {
        // Lấy thông tin staff
        User staff = getUserEntity(username);

        // Lấy thông tin assignment(shelf)
        StocktakeShelfAssignment assignment =getAssignmentEntity(assignmentId);

        // Kiểm tra xem user đó được vào assignment đó không
        if (assignment.getStatus() != AssignmentStatus.OPEN) {
            // Kiểm tra assignment hiện Open & có phải do staff đó mở không
            boolean isMyTask = assignment.getStatus() == AssignmentStatus.IN_PROGRESS
                    && assignment.getStaff() != null
                    && assignment.getStaff().getUsername().equals(username);

            if (!isMyTask) {
                throw new BadRequestException("Kệ này đang được người khác kiểm hoặc đã hoàn thành!");
            }

        // Nếu kệ đó chưa có ai chọn trước    
        } else {
            // Chuyển trạng thái sang IN_PROGRESS, cập nhật thông tin 
            assignment.setStatus(AssignmentStatus.IN_PROGRESS);
            assignment.setStaff(staff);
            assignment.setStartedAt(LocalDateTime.now());

            //Query bảng inventory tìm tất cả hàng đang có tại kệ này
            List<Inventory> inventories = inventoryRepo.findByLocation(assignment.getLocation());
            List<StocktakeDetail> details = new ArrayList<>();

            for (Inventory inv : inventories) {
                if (inv.getQuantity() > 0) {
                    StocktakeDetail detail = StocktakeDetail.builder()
                            .assignment(assignment)
                            .inventory(inv)
                            .systemQtySnapshot(inv.getQuantity()) // Số liệu hệ thống
                            .actualCountedQty(null) // Chưa đếm
                            .build();
                    details.add(detail);
                }
            }

            // Lưu vào DB 
            if (!details.isEmpty()) {
                detailRepo.saveAll(details);
                // Cập nhật lại list details trong object assignment để return đúng
                assignment.setDetails(details);
            }

            assignmentRepo.save(assignment);
        }

        // Trả về danh sách (Ẩn số tồn kho)
        // Nếu assignment.getDetails() null thì trả về list rỗng tránh lỗi
        List<StocktakeDetail> currentDetails = assignment.getDetails() != null ? assignment.getDetails(): new ArrayList<>();
        return currentDetails.stream()
                .map(d -> {
                    // Lấy thông tin sản phẩm từ Inventory
                    Products p = d.getInventory().getProduct();
                    return StocktakeBlindCountResponse.builder()
                        .detailId(d.getId())
                        .productId(p.getId())
                        .productSku(p.getSku())
                        .productName(p.getName())
                        .productImage(p.getImage_url())
                        .locationCode(assignment.getLocation().getCode())
                        .build();
                })
                .collect(Collectors.toList());
    }
    // =================================================================
    /**
     * 15. HOÀN THÀNH KỆ KHI STAFF NHẤN SUBMIT
     */
    // =================================================================
    @Override
    @Transactional
    public void completeAssignment(String username, Long assignmentId, SubmitCountsRequest request) {
        StocktakeShelfAssignment assignment = getAssignmentEntity(assignmentId);

        if (assignment.getStatus() != AssignmentStatus.IN_PROGRESS) {
            throw new BadRequestException("Nhiệm vụ này không ở trạng thái đang thực hiện (IN_PROGRESS)");
        }

        // Check bảo mật: Có đúng là ông Staff này đang làm không?
        if (!assignment.getStaff().getUsername().equals(username)) {
            throw new BadRequestException("Bạn không phải người được phân công nhiệm vụ này!");
        }
        // Xử lý dữ liệu gửi lên
        List<StocktakeDetail> existingDetails = assignment.getDetails();
        List<CountStocktakeItemRequest> submitteditems = request.getItems();

        // Tạo Map để tra cứu nhanh: <DetailId, Quantity> <id sản phẩm , số lượng>
        Map<Long, Integer> updateMap = new HashMap<>();

        if (submitteditems != null) {
            for (CountStocktakeItemRequest item : submitteditems) {
                if (item.getDetailId() != null) {
                    updateMap.put(item.getDetailId(), item.getActualQty());
                }
            }
        }
        // Cập nhật các dòng ĐÃ CÓ
        for (StocktakeDetail detail : existingDetails) {
            if (updateMap.containsKey(detail.getId())) {
                detail.setActualCountedQty(updateMap.get(detail.getId()));
            } else {
                // Staff không nhập -> Coi như mất hàng (0)
                detail.setActualCountedQty(0);
            }
        }

        // Đóng nhiệm vụ
        assignment.setStatus(AssignmentStatus.COMPLETED);
        assignment.setCompletedAt(LocalDateTime.now());
        assignmentRepo.save(assignment);

    }

    // =================================================================
    // MAPPING
    // =================================================================
    /**
     * Map từ Detail sang DTO báo cáo chênh lệch
     */
    private VarianceItemResponse mapVarianceItem (StocktakeDetail details) {
        Integer initial = details.getSystemQtySnapshot();
        // Nếu actual là null (chưa đếm) thì coi như là 0 để tính toán (hoặc giữ null tùy logic, ở đây mình để 0)
        Integer actual = details.getActualCountedQty() != null ? details.getActualCountedQty() : 0;
        Integer variance = actual - initial;

        Products p = details.getInventory().getProduct();
        String locCode = details.getAssignment().getLocation().getCode();

        return VarianceItemResponse.builder()
                .detailId(details.getId())
                .productId(p.getId())
                .productSku(p.getSku())
                .productName(p.getName())
                .locationCode(locCode)

                .systemQty(initial)
                .actualQty(actual)
                .variance(variance)
                .build();
    }

    /**
     * Gom tất cả detail từ assignments lại trong 1 session
     * <p>@param StocktakeSession sessionId</p>
     * */
    private List<StocktakeDetail> getAllDetailsInSession(StocktakeSession session) {
        if (session.getAssignments() == null || session.getAssignments().isEmpty())
            return new ArrayList<>();
        return session.getAssignments().stream()
                .filter(a-> a != null)
                .filter(a -> a.getDetails() != null)
                .flatMap(a -> a.getDetails().stream())
                .collect(Collectors.toList());
    }

    private StocktakeSessionResponse mapSessionToResponse(StocktakeSession session) {

        List<StocktakeDetail> allDetails = getAllDetailsInSession(session);
        return StocktakeSessionResponse.builder()
                .id(session.getId())
                .code(session.getCode())
                .zoneCode(session.getZoneCode())
                .status(session.getStatus().name())
                .totalItems(getTotalItems(allDetails))
                .countedItems(getCountedItems(allDetails))
                .varianceCount(getVarianceCount(allDetails))
                .startedAt(session.getStartedAt() != null ? session.getStartedAt().toString() : null)
                .completedAt(session.getCompletedAt() != null ? session.getCompletedAt().toString() : null)
                .createdBy(session.getCreatedBy() != null ? session.getCreatedBy().getUsername() : null)
                .build();
    }

    private StocktakeDetailResponse mapDetailToResponse(StocktakeDetail detail) {
        Integer initial = detail.getSystemQtySnapshot();
        Integer actual = detail.getActualCountedQty();
        Integer variance = (actual != null && initial != null) ? (actual - initial) : null;
        Products p = detail.getInventory().getProduct();
        Locations l = detail.getAssignment().getLocation();
        return StocktakeDetailResponse.builder()
                .id(detail.getId())
                .productId(detail.getInventory().getProduct().getId())
                .productSku(p.getSku())
                .productName(p.getName())
                .productImage(p.getImage_url())
                .locationId(l.getId())
                .locationCode(l.getCode())
                .systemQtySnapshot(initial != null ? initial : 0)
                .actualCountedQty(actual)
                .variance(variance)
                .build();
    }

    private VarianceItemResponse mapToVarianceItem(StocktakeDetail d) {
        int initial = d.getSystemQtySnapshot();
        int actual = d.getActualCountedQty();
        int variance = actual - initial;

        // Lấy thông tin Product từ Inventory
        Products p = d.getInventory().getProduct();
        // Lấy thông tin Location từ Assignment
        String locCode = d.getAssignment().getLocation().getCode();

        return VarianceItemResponse.builder()
                .detailId(d.getId())
                .productId(p.getId())
                .productSku(p.getSku())
                .productName(p.getName())
                .locationCode(locCode)
                .systemQty(initial)
                .actualQty(actual)
                .variance(variance)
                .build();
    }

    //====================HELPER=========================
    /**
     * Hàm điều chỉnh kho
     */
    private void adjustInventory(StocktakeDetail detail, User manager) {
        Products product = detail.getInventory().getProduct();
        Locations location = detail.getAssignment().getLocation();
        StocktakeSession session = detail.getAssignment().getSession();

        Inventory inventory = inventoryRepo.findByProductAndLocation(product, location)
                .orElse(null);

        int oldQty = 0;
        if (inventory != null) {
            oldQty = inventory.getQuantity();
        } else {
            inventory = Inventory.builder()
                    .product(product)
                    .location(location)
                    .build();
        }
        // Số lượng mới
        int newQty = detail.getActualCountedQty() != null ? detail.getActualCountedQty() : 0;
        //Sai lệch
        int variance = newQty - oldQty;

        inventory.setQuantity(newQty);
        
        // Logic xóa nếu = 0 hoặc save
        if (newQty == 0 && inventory.getId() != null) {
            inventoryRepo.delete(inventory);
        } else {
            inventoryRepo.save(inventory);
        }

        // Tạo Transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
                .type(TransactionType.STOCKTAKE_ADJUST)
                .product(product)
                .location(location)
                .quantityBefore(oldQty)
                .quantityChanged(Math.abs(variance))
                .quantityAfter(newQty)
                .performedBy(manager)
                .referenceDocId(session.getCode()) // Lấy code từ session đã lấy ở trên
                .build();

        transactionRepo.save(transaction);
    }

    /**
     * Tạo mã code cho phiên
     */
    private String generateSessionCode() {
        return "ST-" + System.currentTimeMillis();
    }

    /**
     *   Kiểm tra hàng có chênh lệch số lượng hay không   
     */
    private boolean isVariance (StocktakeDetail detail){
        return detail.getActualCountedQty() != null 
            && !detail.getActualCountedQty().equals(detail.getSystemQtySnapshot());
    }


    /**
     * Lấy Entity Assignment từ Database
     */
    private StocktakeShelfAssignment getAssignmentEntity(Long assignmentId) {
        return assignmentRepo.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy việc phân công"));
    }

    /**
     * Lấy Entity StocktakeSession từ Database
     */
    private StocktakeSession getSessionById(Long sessionId) {
        return sessionRepo.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê với ID: " + sessionId));
    }

    /**
     * Lấy Entity User từ Database để map quan hệ
     */
    private User getUserEntity(String username) {
        return userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Lỗi dữ liệu: User không tồn tại trong DB: " + username));
    }

    /**
     * Tìm tất cả locations bắt đầu bằng zoneCode và lọc các location có chứa hàng
     * (VD:zoneCode = A -> A-01-01,A-01-02,...)
     */
    private List<Locations> findValidLocationsByZoneCode(String zoneCode) {
        List<Locations> locations = locationRepo.findByCodeStartingWith(zoneCode + "-");
        return locations.stream()
                .filter(l -> l.getLocationType() == LocationType.SHELF_STORAGE)
                .collect(Collectors.toList());
    }

    /**
     * Tạo các phiếu task theo từng validLocations và lưu vào DB
     */
    private void createAssignments(StocktakeSession session,List<Locations> validLocations) {
        List<StocktakeShelfAssignment> assignments = validLocations.stream()
                .map(loc -> StocktakeShelfAssignment.builder()
                            .session(session)
                            .location(loc)
                            .status(AssignmentStatus.DRAFF)
                            .staff(null)
                            .build())
                            .collect(Collectors.toList());
                assignmentRepo.saveAll(assignments);
    }


    /**
     * Lấy tổng số hàng kiểm kê ở một session
     */
    private int getTotalItems(List<StocktakeDetail> details) {
        return (details == null || details.isEmpty()) ? 0 : details.size(); 
    }

    /**
     * Đếm số lượng hàng đã đếm bởi staff
     */
    private int getCountedItems(List<StocktakeDetail> details) {
        if (details == null || details.isEmpty())
            return 0;
        return (int) details.stream()
                .filter(d -> d.getActualCountedQty() != null)
                .count();
    }

    /**
     * Đếm số lượng chênh lệch sản phẩm bị sai số lượng
     */
    private int getVarianceCount(List<StocktakeDetail> details) {
        if (details == null || details.isEmpty())
            return 0;
        return (int) details.stream()
                .filter(d -> d.getActualCountedQty() != null)
                .filter(d -> d.getActualCountedQty() != d.getSystemQtySnapshot())
                .count();
    }


}


//=======================MẤY CÁI HÀM KHÔNG CẦN THIẾT SO VỚI LOGIC HIỆN TẠI NỮA============================================
    
// =================================================================
    // 7. LẤY DANH SÁCH BLIND COUNT
    // =================================================================
    // @Override
    // public List<StocktakeBlindCountResponse> getBlindCountList(Long sessionId) {
    //     StocktakeSession session = sessionRepo.findById(sessionId)
    //             .orElseThrow(() -> new RuntimeException("Không tìm thấy phiên kiểm kê"));
    //     if (session.getDetails() == null)
    //         return new ArrayList<>();
    //     return session.getDetails().stream()
    //             .map(detail -> StocktakeBlindCountResponse.builder()
    //                     .detailId(detail.getId())
    //                     .productId(detail.getProduct().getId())
    //                     .productSku(detail.getProduct().getSku())
    //                     .productName(detail.getProduct().getName())
    //                     .locationCode(detail.getLocation().getCode())
    //                     .productImage(detail.getProduct().getImage_url())
    //                     .actualCountedQty(detail.getActualCountedQty())
    //                     .build())
    //             .collect(Collectors.toList());
    // }
    // =================================================================
    // 8. STAFF NHẬP SỐ LƯỢNG
    // =================================================================
    // @Override
    // @Transactional
    // public StocktakeDetailResponse submitCount(String username, CountStocktakeItemRequest request) {
    //     // Validate user tồn tại
    //     if (!userRepo.existsByUsername(username)) {
    //         throw new RuntimeException("User không tồn tại: " + username);
    //     }
    //     StocktakeDetail detail = detailRepo.findById(request.getDetailId())
    //             .orElseThrow(() -> new RuntimeException("Không tìm thấy chi tiết kiểm kê"));
    //     detail.setActualCountedQty(request.getActualQty());
    //     detailRepo.save(detail);
    //     return mapDetailToResponse(detail);
    // }
    // =================================================================
    // 9. SUBMIT NHIỀU SẢN PHẨM
    // =================================================================
    // @Override
    // @Transactional
    // public List<StocktakeDetailResponse> submitCounts(String username, SubmitCountsRequest request) {
    //     List<StocktakeDetailResponse> results = new ArrayList<>();
    //     for (CountStocktakeItemRequest count : request.getCounts()) {
    //         results.add(submitCount(username, count));
    //     }
    //     return results;
    // }
    ///**
    // * Kiểm tra nếu tất cả assignment xong thì đóng Session
    // * <p>@param StocktakeSession sessionId</p>
    // * */
    // private void checkAndCompleteSession(StocktakeSession session) {
    //     // Lấy lại danh sách mới nhất từ DB để đảm bảo chính xác
    //     List<StocktakeShelfAssignment> allTasks = assignmentRepo.findBySessionId(session.getId());
    //
    //     boolean allDone = allTasks.stream()
    //             .allMatch(t -> t.getStatus() == AssignmentStatus.COMPLETED);
    //
    //     if (allDone) {
    //         session.setStatus(StocktakeStatus.COMPLETED);
    //         session.setCompletedAt(LocalDateTime.now());
    //         sessionRepo.save(session);
    //     }
    // }

// ==============================================================================================