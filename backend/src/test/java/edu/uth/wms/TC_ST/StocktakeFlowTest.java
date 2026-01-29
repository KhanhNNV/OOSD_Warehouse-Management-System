package edu.uth.wms.TC_ST;

import edu.uth.wms.TC_ST.DataMock.TestDataFactory;
import edu.uth.wms.dto.request.*;
import edu.uth.wms.dto.response.*;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.impl.StocktakeServiceImpl;
import edu.uth.wms.exceptions.BadRequestException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.ArgumentCaptor;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Kiểm thử luồng nghiệp vụ: Kiểm kê kho (Zone A)")
public class StocktakeFlowTest {

    @Mock
    private IStocktakeSessionRepository sessionRepo;
    @Mock
    private IStocktakeDetailRepository detailRepo;
    @Mock
    private IInventoryRepository inventoryRepo;
    @Mock
    private IUserRepository userRepo;
    @Mock
    private ITransactionRepository transactionRepo;
    @Mock
    private IStocktakeShelfAssignmentRepository assignmentRepo;
    @Mock
    private ILocationRepository locationRepo;

    @InjectMocks
    private StocktakeServiceImpl stocktakeService;

    // Sử dụng scenario để quản lý toàn bộ dữ liệu mẫu tập trung
    private TestDataFactory.StocktakeScenario scenario;

    @BeforeEach
    void setUp() {
        // Khởi tạo kịch bản kiểm kê đầy đủ từ Factory
        scenario = TestDataFactory.createFullScenario();
    }

    /**
     * Kịch bản tổng hợp:
     * 1. Manager tạo phiếu cho Zone A (Trạng thái DRAFT).
     * 2. Manager mở phiên (DRAFT -> IN_PROGRESS).
     * 3. Staff vào nhận việc và bắt đầu đếm (Start Assignment).
     * 4. Staff nhập số lượng thực tế 8 (Hệ thống 10 -> Lệch -2).
     * 5. Manager duyệt điều chỉnh kho (Cập nhật Inventory & tạo Transaction).
     */
    @Test
    void testFullStocktakeFlow() {
        // ============================================================
        // BƯỚC 1: TẠO PHIÊN KIỂM KÊ
        // ============================================================
        System.out.println("--- BƯỚC 1: Manager tạo phiên kiểm kê Zone A ---");

        CreateStocktakeRequest createReq = new CreateStocktakeRequest();
        createReq.setZoneCode("A");

        // Mock cho createSession
        when(userRepo.findByUsername(scenario.manager.getUsername())).thenReturn(Optional.of(scenario.manager));
        when(sessionRepo.save(any(StocktakeSession.class))).thenReturn(scenario.session);
        when(locationRepo.findByCodeStartingWith("A-")).thenReturn(List.of(scenario.location));
        when(inventoryRepo.findByLocation(scenario.location)).thenReturn(List.of(scenario.inventory));

        StocktakeSessionResponse sessionRes = stocktakeService.createSession(scenario.manager.getUsername(), createReq);

        assertNotNull(sessionRes);
        assertEquals("A", sessionRes.getZoneCode());
        verify(assignmentRepo).saveAll(anyList()); // Đảm bảo đã tạo task đếm kệ

        // ============================================================
        // BƯỚC 2: MỞ PHIÊN (DRAFT -> IN_PROGRESS)
        // ============================================================
        System.out.println("--- BƯỚC 2: Manager mở phiên kiểm kê ---");

        scenario.session.setStatus(StocktakeStatus.DRAFT);
        when(sessionRepo.findById(scenario.session.getId())).thenReturn(Optional.of(scenario.session));
        when(assignmentRepo.findBySessionId(scenario.session.getId())).thenReturn(List.of(scenario.assignment));
        when(sessionRepo.save(any(StocktakeSession.class))).thenReturn(scenario.session);

        StocktakeSessionResponse openRes = stocktakeService.openSession(scenario.session.getId());

        assertEquals("IN_PROGRESS", openRes.getStatus());
        assertEquals(AssignmentStatus.OPEN, scenario.assignment.getStatus());

        // ============================================================
        // BƯỚC 3: STAFF BẮT ĐẦU ĐẾM (TC_ST_02 - Blind Count)
        // ============================================================
        System.out.println("--- BƯỚC 3: Staff bắt đầu đếm kệ A-01-01 ---");

        when(userRepo.findByUsername(scenario.staff.getUsername())).thenReturn(Optional.of(scenario.staff));
        when(assignmentRepo.findById(scenario.assignment.getId())).thenReturn(Optional.of(scenario.assignment));
        when(inventoryRepo.findByLocation(scenario.location)).thenReturn(List.of(scenario.inventory));

        when(detailRepo.saveAll(anyList())).thenAnswer(invocation -> {
            List<StocktakeDetail> list = invocation.getArgument(0);
            if (!list.isEmpty()) {
                list.get(0).setId(scenario.detail.getId());
            }
            return list;
        });

        List<StocktakeBlindCountResponse> blindList = stocktakeService.startAssignment(scenario.staff.getUsername(),
                scenario.assignment.getId());

        assertFalse(blindList.isEmpty());
        assertEquals("SP-C", blindList.get(0).getProductSku());
        assertEquals(AssignmentStatus.IN_PROGRESS, scenario.assignment.getStatus());
        verify(detailRepo).saveAll(anyList()); // Snapshot tồn kho được tạo

        // ============================================================
        // BƯỚC 4: STAFF HOÀN THÀNH ĐẾM (TC_ST_03 - Ghi nhận chênh lệch)
        // ============================================================
        System.out.println("--- BƯỚC 4: Staff nhập số lượng 8 (Lệch -2) ---");

        // Chuẩn bị Request: Staff nhập thực tế 8
        SubmitCountsRequest submitReq = new SubmitCountsRequest();
        submitReq.setItems(List.of(CountStocktakeItemRequest.builder()
                .detailId(scenario.detail.getId())
                .productId(scenario.product.getId())
                .actualQty(8)
                .build()));

        // Mock cho completeAssignment
        when(assignmentRepo.findById(scenario.assignment.getId())).thenReturn(Optional.of(scenario.assignment));
        // Mock checkAndAutoCompleteSession logic
        when(assignmentRepo.findBySessionId(scenario.session.getId())).thenReturn(List.of(scenario.assignment));

        stocktakeService.completeAssignment(scenario.staff.getUsername(), scenario.assignment.getId(), submitReq);

        // Verify trên detail MỚI NHẤT trong assignment (vì startAssignment đã replace
        // list details)
        StocktakeDetail updatedDetail = scenario.assignment.getDetails().get(0);
        assertEquals(8, updatedDetail.getActualCountedQty());
        assertEquals(AssignmentStatus.COMPLETED, scenario.assignment.getStatus());

        // Session phải chuyển sang NEEDS_ADJUSTMENT do có chênh lệch (8 vs 10)
        ArgumentCaptor<StocktakeSession> sessionCaptor = ArgumentCaptor.forClass(StocktakeSession.class);
        verify(sessionRepo, atLeastOnce()).save(sessionCaptor.capture());
        assertEquals(StocktakeStatus.NEEDS_ADJUSTMENT, sessionCaptor.getValue().getStatus());

        // ============================================================
        // BƯỚC 5: MANAGER DUYỆT ĐIỀU CHỈNH (TC_ST_04)
        // ============================================================
        System.out.println("--- BƯỚC 5: Manager duyệt điều chỉnh kho ---");

        scenario.session.setStatus(StocktakeStatus.NEEDS_ADJUSTMENT);
        ApproveAdjustmentRequest approveReq = new ApproveAdjustmentRequest();
        approveReq.setSessionId(scenario.session.getId());

        when(userRepo.findByUsername(scenario.manager.getUsername())).thenReturn(Optional.of(scenario.manager));
        when(sessionRepo.findById(scenario.session.getId())).thenReturn(Optional.of(scenario.session));
        // Quan trọng: Phải tìm được detail đã update (8) chứ không phải detail cũ
        // (null)
        when(detailRepo.findBySessionId(scenario.session.getId())).thenReturn(List.of(updatedDetail));
        when(sessionRepo.save(any(StocktakeSession.class))).thenReturn(scenario.session);

        stocktakeService.approveAdjustment(scenario.manager.getUsername(), approveReq);

        // Verify kết quả cuối cùng
        assertEquals(8, scenario.inventory.getQuantity()); // Tồn kho thật cập nhật thành 8

        ArgumentCaptor<InventoryTransaction> txCaptor = ArgumentCaptor.forClass(InventoryTransaction.class);
        verify(transactionRepo).save(txCaptor.capture());
        assertEquals(TransactionType.STOCKTAKE_ADJUST, txCaptor.getValue().getType());
        assertEquals(-2, txCaptor.getValue().getQuantityChanged()); // Lệch -2

        assertEquals(StocktakeStatus.ADJUSTED, scenario.session.getStatus());

        System.out.println("✅ Kiểm thử luồng nghiệp vụ Stocktake thành công!");
    }

    /**
     * Case phụ 1: Một Staff khác (không được phân công) cố tình vào submit kết quả
     * -> Hệ thống phải chặn và ném lỗi (BadRequestException).
     */
    @Test
    void testSecurity_StaffCannotDoOthersTask() {
        System.out.println("--- Test Security: Chặn staff khác làm nhiệm vụ ---");

        // 1. Setup: Kệ đã được assign cho staff1
        scenario.assignment.setStatus(AssignmentStatus.IN_PROGRESS);
        scenario.assignment.setStaff(scenario.staff); // Chính chủ

        // 2. Mock
        when(assignmentRepo.findById(scenario.assignment.getId())).thenReturn(Optional.of(scenario.assignment));

        // 3. Action & Assert: Hacker cố submit
        SubmitCountsRequest req = new SubmitCountsRequest();

        Exception result = assertThrows(BadRequestException.class, () -> {
            stocktakeService.completeAssignment("hacker", scenario.assignment.getId(), req);
        });

        assertEquals("Bạn không phải người được phân công nhiệm vụ này!", result.getMessage());
        System.out.println("✅ Đã chặn thành công người lạ!");
    }

    /**
     * Case phụ 2: Cố gắng bắt đầu đếm khi Phiên kiểm kê chưa được Mở (OPEN)
     * -> Phải chặn
     */
    @Test
    void testLogic_CannotStartAssignmentIfNotOpen() {
        System.out.println("--- Test Logic: Không thể Start khi trạng thái sai ---");

        // Assignment đang DRAFT (chưa được Manager mở)
        scenario.assignment.setStatus(AssignmentStatus.DRAFT);

        when(userRepo.findByUsername(scenario.staff.getUsername())).thenReturn(Optional.of(scenario.staff));
        when(assignmentRepo.findById(scenario.assignment.getId())).thenReturn(Optional.of(scenario.assignment));

        // Không thể start nếu status != OPEN và cũng không phải là IN_PROGRESS của
        // chính mình
        Exception result = assertThrows(BadRequestException.class, () -> {
            stocktakeService.startAssignment(scenario.staff.getUsername(), scenario.assignment.getId());
        });

        System.out.println("✅ Đã chặn start assignment khi status không hợp lệ. Msg: " + result.getMessage());
    }

    /**
     * Case phụ 3: Manager cố duyệt khi Session chưa xong (Vẫn còn In Progress)
     */
    @Test
    void testLogic_CannotApproveIfNotReady() {
        System.out.println("--- Test Logic: Không thể Approve khi chưa xong ---");

        scenario.session.setStatus(StocktakeStatus.IN_PROGRESS); // Vẫn đang đếm
        ApproveAdjustmentRequest req = new ApproveAdjustmentRequest();
        req.setSessionId(scenario.session.getId());

        when(userRepo.findByUsername(scenario.manager.getUsername())).thenReturn(Optional.of(scenario.manager));
        when(sessionRepo.findById(scenario.session.getId())).thenReturn(Optional.of(scenario.session));

        Exception result = assertThrows(BadRequestException.class, () -> {
            stocktakeService.approveAdjustment(scenario.manager.getUsername(), req);
        });

        assertEquals("Chỉ có thể điều chỉnh phiên đang ở trạng thái CẦN ĐIỀU CHỈNH hoặc HOÀN THÀNH",
                result.getMessage());
        System.out.println("✅ Đã chặn duyệt khi session chưa hoàn thành!");
    }
}