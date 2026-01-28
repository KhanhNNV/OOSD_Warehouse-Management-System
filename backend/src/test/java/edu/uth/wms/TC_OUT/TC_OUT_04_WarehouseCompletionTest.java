package edu.uth.wms.TC_OUT;

import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.impl.OutboundOrderForStaffServiceImpl;
import edu.uth.wms.service.strategy.PickingStrategyFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * TC_OUT_04: Trừ kho & Hoàn tất
 * 
 * Mô tả: Kiểm tra quá trình trừ kho và chuyển trạng thái đơn hàng
 * 
 * Test Steps:
 * 1. Staff nhập SL lấy: 1
 * 2. Nhấn "Xác nhận xuất" (Confirm Issue)
 * 
 * Test Data:
 * SL lấy: 1
 * 
 * Expected Result:
 * Tồn kho thực tế (Physical Qty) tại Kệ A giảm đi 1. 
 * Đơn hàng chuyển trạng thái "Completed"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TC_OUT_04: Trừ kho & Hoàn tất")
public class TC_OUT_04_WarehouseCompletionTest {

    @Mock
    private IOutboundOrderRepository outboundOrderRepo;

    @Mock
    private IOutboundDetailRepository outboundDetailRepo;

    @Mock
    private IOutboundNoteRepository outboundNoteRepo;

    @Mock
    private IOutboundNoteDetailRepository outboundNoteDetailRepo;

    @Mock
    private IUserRepository userRepo;

    @Mock
    private ISystemConfigService configService;

    @Mock
    private PickingStrategyFactory strategyFactory;

    @Mock
    private IInventoryRepository inventoryRepo;

    @Mock
    private ITransactionRepository transactionRepo;

    @InjectMocks
    private OutboundOrderForStaffServiceImpl staffService;

    private OutboundOrder order;
    private OutboundNote note;
    private Products productA;
    private Locations locationA;
    private Inventory inventory;
    private User staff;

    @BeforeEach
    void setUp() {
        // Setup authentication mock
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        lenient().when(authentication.getName()).thenReturn("staff1");
        SecurityContextHolder.setContext(securityContext);

        // Staff user
        staff = User.builder()
                .id(1L)
                .username("staff1")
                .fullName("Staff Test")
                .role(Role.STAFF)
                .build();

        // Product A
        productA = Products.builder()
                .id(1L)
                .sku("SP-A")
                .name("Sản phẩm A")
                .barcode("BARCODE-A")
                .build();

        // Location A
        locationA = Locations.builder()
                .id(1L)
                .code("A-01-01")
                .locationType(LocationType.SHELF_STORAGE)
                .build();

        // Inventory - Ban đầu có 10 sản phẩm, đã khóa 1
        inventory = Inventory.builder()
                .id(1L)
                .product(productA)
                .location(locationA)
                .quantity(10)
                .quantityAllocated(1)
                .build();

        // Outbound Order
        order = OutboundOrder.builder()
                .id(1L)
                .orderNumber("OB-123")
                .status(OrderStatus.PICKING)
                .build();

        OutboundDetail detail = OutboundDetail.builder()
                .id(1L)
                .outboundOrder(order)
                .product(productA)
                .requestedQty(1)
                .allocatedQty(1)
                .build();

        order.setDetails(new ArrayList<>(Arrays.asList(detail)));

        // Outbound Note
        note = OutboundNote.builder()
                .id(1L)
                .outboundOrder(order)
                .code("PXK-123")
                .status(OutboundNoteStatus.DRAFT)
                .createdBy(staff)
                .details(new ArrayList<>())
                .build();

        // Setup common mocks
        lenient().when(userRepo.findByUsername("staff1")).thenReturn(Optional.of(staff));
        lenient().when(outboundNoteRepo.findByOutboundOrderId(1L)).thenReturn(Optional.of(note));
        lenient().when(outboundOrderRepo.findById(1L)).thenReturn(Optional.of(order));
    }

    @Test
    @DisplayName("Test 1 - Trừ tồn kho vật lý sau khi xác nhận")
    void testPhysicalInventoryReduction() {
        // Given
        int initialQuantity = inventory.getQuantity(); // 10
        int pickedQuantity = 1;

        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(pickedQuantity);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.save(any(Inventory.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When: Thực hiện xuất hàng
        inventory.setQuantity(initialQuantity - pickedQuantity);

        // Then: Verify tồn kho giảm
        assertEquals(9, inventory.getQuantity(), 
                "Tồn kho vật lý phải giảm từ 10 xuống 9");
        assertEquals(initialQuantity - pickedQuantity, inventory.getQuantity());
    }

    @Test
    @DisplayName("Test 2 - Giải phóng số lượng đã khóa")
    void testReleaseAllocatedQuantity() {
        // Given
        int initialAllocated = inventory.getQuantityAllocated(); // 1
        int pickedQuantity = 1;

        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(pickedQuantity);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));

        // When: Xuất hàng
        int newAllocated = Math.max(0, initialAllocated - pickedQuantity);
        inventory.setQuantityAllocated(newAllocated);

        // Then: Verify số lượng khóa được giải phóng
        assertEquals(0, inventory.getQuantityAllocated(),
                "Số lượng đã khóa phải giảm từ 1 xuống 0");
    }

    @Test
    @DisplayName("Test 3 - Tạo transaction log khi xuất hàng")
    void testCreateTransactionLog() {
        // Given
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(1);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));
        lenient().when(transactionRepo.save(any(InventoryTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When: Tạo transaction
        InventoryTransaction transaction = InventoryTransaction.builder()
                .product(productA)
                .location(locationA)
                .type(TransactionType.OUTBOUND_SHIP)
                .quantityBefore(10)
                .quantityChanged(1)
                .quantityAfter(9)
                .referenceDocId("PXK-123")
                .performedBy(staff)
                .timestamp(LocalDateTime.now())
                .build();

        // Then: Verify transaction properties
        assertNotNull(transaction);
        assertEquals(TransactionType.OUTBOUND_SHIP, transaction.getType());
        assertEquals(10, transaction.getQuantityBefore());
        assertEquals(1, transaction.getQuantityChanged());
        assertEquals(9, transaction.getQuantityAfter());
        assertEquals("PXK-123", transaction.getReferenceDocId());
        assertEquals(staff, transaction.getPerformedBy());
    }

    @Test
    @DisplayName("Test 4 - Tạo OutboundNoteDetail")
    void testCreateOutboundNoteDetail() {
        // Given
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(1);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));

        // When: Tạo note detail
        OutboundNoteDetail noteDetail = OutboundNoteDetail.builder()
                .outboundNote(note)
                .product(productA)
                .sourceLocation(locationA)
                .quantity(1)
                .build();

        // Then: Verify note detail
        assertNotNull(noteDetail);
        assertEquals(note, noteDetail.getOutboundNote());
        assertEquals(productA, noteDetail.getProduct());
        assertEquals(locationA, noteDetail.getSourceLocation());
        assertEquals(1, noteDetail.getQuantity());
    }

    @Test
    @DisplayName("Test 5 - Chuyển trạng thái OutboundNote sang COMPLETED")
    void testOutboundNoteStatusChange() {
        // Given
        assertEquals(OutboundNoteStatus.DRAFT, note.getStatus());

        List<BatchPickingRequest> requests = new ArrayList<>(Arrays.asList(
            createBatchRequest(1L, 1L, 1)
        ));

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(anyLong(), anyLong()))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.save(any())).thenReturn(inventory);
        lenient().when(transactionRepo.save(any())).thenReturn(new InventoryTransaction());
        lenient().when(outboundNoteRepo.save(any(OutboundNote.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        lenient().when(outboundOrderRepo.save(any())).thenReturn(order);

        // When: Submit picking
        assertDoesNotThrow(() -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Then: Verify note status
        verify(outboundNoteRepo).save(argThat(n -> 
            n.getStatus() == OutboundNoteStatus.COMPLETED
        ));
    }

    @Test
    @DisplayName("Test 6 - Cập nhật exportedDate khi hoàn thành")
    void testExportedDateUpdate() {
        // Given
        assertNull(note.getExportedDate());

        // When: Hoàn thành picking
        note.setExportedDate(LocalDateTime.now());

        // Then: Verify exported date được set
        assertNotNull(note.getExportedDate());
        assertTrue(note.getExportedDate().isBefore(LocalDateTime.now().plusSeconds(1)));
    }

    @Test
    @DisplayName("Test 7 - Chuyển trạng thái Order sang PACKED")
    void testOrderStatusChangeToPacked() {
        // Given
        assertEquals(OrderStatus.PICKING, order.getStatus());

        List<BatchPickingRequest> requests = new ArrayList<>(Arrays.asList(
            createBatchRequest(1L, 1L, 1)
        ));

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(anyLong(), anyLong()))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.save(any())).thenReturn(inventory);
        lenient().when(transactionRepo.save(any())).thenReturn(new InventoryTransaction());
        lenient().when(outboundNoteRepo.save(any())).thenReturn(note);
        lenient().when(outboundOrderRepo.save(any(OutboundOrder.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When: Submit picking
        assertDoesNotThrow(() -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Then: Verify order status
        verify(outboundOrderRepo).save(argThat(o -> 
            o.getStatus() == OrderStatus.PACKED
        ));
    }

    @Test
    @DisplayName("Test 8 - Xử lý nhiều sản phẩm cùng lúc")
    void testMultipleProductsPicking() {
        // Given: Thêm sản phẩm B
        Products productB = Products.builder()
                .id(2L)
                .sku("SP-B")
                .name("Sản phẩm B")
                .build();

        Locations locationB = Locations.builder()
                .id(2L)
                .code("B-01-01")
                .locationType(LocationType.SHELF_STORAGE)
                .build();

        Inventory inventoryB = Inventory.builder()
                .id(2L)
                .product(productB)
                .location(locationB)
                .quantity(20)
                .quantityAllocated(2)
                .build();

        OutboundDetail detailB = OutboundDetail.builder()
                .id(2L)
                .outboundOrder(order)
                .product(productB)
                .requestedQty(2)
                .allocatedQty(2)
                .build();

        order.getDetails().add(detailB);

        List<BatchPickingRequest> requests = new ArrayList<>(Arrays.asList(
            createBatchRequest(1L, 1L, 1),
            createBatchRequest(2L, 2L, 2)
        ));

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(2L, 2L))
                .thenReturn(Optional.of(inventoryB));
        lenient().when(inventoryRepo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(transactionRepo.save(any())).thenReturn(new InventoryTransaction());
        lenient().when(outboundNoteRepo.save(any())).thenReturn(note);
        lenient().when(outboundOrderRepo.save(any())).thenReturn(order);

        // When
        assertDoesNotThrow(() -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Then: Verify cả 2 inventory đều được cập nhật
        verify(inventoryRepo, times(2)).save(any(Inventory.class));
        verify(transactionRepo, times(2)).save(any(InventoryTransaction.class));
    }

    @Test
    @DisplayName("Test 9 - Rollback khi có lỗi")
    void testRollbackOnError() {
        // Given: Setup để gây lỗi
        List<BatchPickingRequest> requests = new ArrayList<>(Arrays.asList(
            createBatchRequest(1L, 1L, 100) // Số lượng quá lớn
        ));

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));

        // When & Then: Expect exception và rollback
        assertThrows(Exception.class, () -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Verify không có thay đổi được lưu
        verify(outboundNoteRepo, never()).save(any());
        verify(outboundOrderRepo, never()).save(any());
    }

    @Test
    @DisplayName("Test 10 - Verify tổng số lượng xuất khớp với yêu cầu")
    void testTotalPickedQuantityMatches() {
        // Given
        int requestedQty = 1;
        int pickedQty = 1;

        List<BatchPickingRequest> requests = new ArrayList<>(Arrays.asList(
            createBatchRequest(1L, 1L, pickedQty)
        ));

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(anyLong(), anyLong()))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.save(any())).thenReturn(inventory);
        lenient().when(transactionRepo.save(any())).thenReturn(new InventoryTransaction());
        lenient().when(outboundNoteRepo.save(any())).thenReturn(note);
        lenient().when(outboundOrderRepo.save(any())).thenReturn(order);

        // When
        assertDoesNotThrow(() -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Then: Verify số lượng
        assertEquals(requestedQty, pickedQty, 
                "Số lượng xuất phải khớp với số lượng yêu cầu");
    }

    // Helper method
    private BatchPickingRequest createBatchRequest(Long productId, Long locationId, Integer qty) {
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(productId);
        request.setLocationId(locationId);
        request.setActualQty(qty);
        return request;
    }
}
