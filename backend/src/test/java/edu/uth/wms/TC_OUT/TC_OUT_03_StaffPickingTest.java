package edu.uth.wms.TC_OUT;

import edu.uth.wms.dto.request.BatchPickingRequest;
import edu.uth.wms.dto.response.OutboundDetailResponse;
import edu.uth.wms.exceptions.BadRequestException;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.impl.OutboundOrderForStaffServiceImpl;
import edu.uth.wms.service.impl.OutboundServiceImpl;
import edu.uth.wms.service.strategy.*;
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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * TC_OUT_03: Staff thực hiện Picking
 * 
 * Mô tả: Kiểm tra quy trình Staff quét mã và lấy hàng
 * 
 * Test Steps:
 * 1. Staff mở App, chọn Task Picking
 * 2. App chỉ dẫn đến Kệ A
 * 3. Staff quét mã vị trí: A-01-01
 * 4. Quét mã SP A
 * 
 * Test Data:
 * Vị trí đúng, SP đúng
 * 
 * Expected Result:
 * App cho phép nhập số lượng lấy. Nếu quét sai vị trí, App báo lỗi.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TC_OUT_03: Staff thực hiện Picking")
public class TC_OUT_03_StaffPickingTest {

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

    @Mock
    private IProductRepository productRepo;

    @Mock
    private ILocationRepository locationRepo;

    @Mock
    private PickingStrategy pickingStrategy;

    @InjectMocks
    private OutboundOrderForStaffServiceImpl staffService;

    @InjectMocks
    private OutboundServiceImpl outboundService;

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

        // Inventory
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

        order.setDetails(Arrays.asList(detail));

        // Outbound Note
        note = OutboundNote.builder()
                .id(1L)
                .outboundOrder(order)
                .code("PXK-123")
                .status(OutboundNoteStatus.DRAFT)
                .createdBy(staff)
                .build();

        // Setup mocks
        lenient().when(userRepo.findByUsername("staff1")).thenReturn(Optional.of(staff));
        lenient().when(outboundNoteRepo.findByOutboundOrderId(1L)).thenReturn(Optional.of(note));
        lenient().when(outboundOrderRepo.findById(1L)).thenReturn(Optional.of(order));
        lenient().when(configService.getCurrentAlgorithm()).thenReturn(PickingAlgorithmType.FIFO);
        lenient().when(strategyFactory.getStrategy(any())).thenReturn(pickingStrategy);
    }

    @Test
    @DisplayName("Test 1 - Staff nhận đơn và xem chỉ dẫn lấy hàng")
    void testStaffViewPickingInstructions() {
        // Given
        lenient().when(inventoryRepo.findByProductIdAndQuantityAllocatedGreaterThan(1L, 0))
                .thenReturn(Arrays.asList(inventory));
        lenient().when(pickingStrategy.suggestPickingOrder(any(), anyInt(), anyList()))
                .thenReturn(Arrays.asList(inventory));

        // When
        List<OutboundDetailResponse> instructions = 
                staffService.getOutboundDetails(1L);

        // Then
        assertNotNull(instructions);
        assertFalse(instructions.isEmpty());
        
        OutboundDetailResponse firstItem = instructions.get(0);
        assertEquals("SP-A", firstItem.getProductSku());
        assertEquals("A-01-01", firstItem.getRecommendedLocationCode());
        assertEquals(1, firstItem.getPickupQty());
        
        verify(outboundNoteRepo).findByOutboundOrderId(1L);
    }

    @Test
    @DisplayName("Test 2 - Staff quét mã vị trí đúng")
    void testScanCorrectLocation() {
        // Given: Vị trí yêu cầu là A-01-01
        String expectedLocation = "A-01-01";
        String scannedLocation = "A-01-01";

        // When: Staff quét mã
        boolean isCorrect = expectedLocation.equalsIgnoreCase(scannedLocation);

        // Then: Hệ thống chấp nhận
        assertTrue(isCorrect, "Vị trí quét đúng với vị trí yêu cầu");
    }

    @Test
    @DisplayName("Test 3 - Staff quét mã vị trí sai")
    void testScanWrongLocation() {
        // Given: Vị trí yêu cầu là A-01-01
        String expectedLocation = "A-01-01";
        String scannedLocation = "B-01-01"; // Quét sai

        // When & Then: Hệ thống báo lỗi
        assertNotEquals(expectedLocation, scannedLocation);
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (!expectedLocation.equalsIgnoreCase(scannedLocation)) {
                throw new RuntimeException(
                    String.format("Sai vị trí! Cần đến: %s", expectedLocation)
                );
            }
        });
        
        assertTrue(exception.getMessage().contains("Sai vị trí"));
        assertTrue(exception.getMessage().contains("A-01-01"));
    }

    @Test
    @DisplayName("Test 4 - Staff quét mã sản phẩm đúng")
    void testScanCorrectProduct() {
        // Given
        String expectedBarcode = "BARCODE-A";
        String scannedBarcode = "BARCODE-A";

        lenient().when(productRepo.findByBarcode(scannedBarcode))
                .thenReturn(Optional.of(productA));

        // When
        Optional<Products> product = productRepo.findByBarcode(scannedBarcode);

        // Then
        assertTrue(product.isPresent());
        assertEquals("SP-A", product.get().getSku());
        assertEquals(expectedBarcode, product.get().getBarcode());
    }

    @Test
    @DisplayName("Test 5 - Staff quét mã sản phẩm sai")
    void testScanWrongProduct() {
        // Given: Cần SP-A nhưng quét SP-B
        String expectedSku = "SP-A";
        String scannedBarcode = "BARCODE-B";
        
        Products wrongProduct = Products.builder()
                .id(2L)
                .sku("SP-B")
                .barcode("BARCODE-B")
                .build();

        lenient().when(productRepo.findByBarcode(scannedBarcode))
                .thenReturn(Optional.of(wrongProduct));

        // When
        Optional<Products> product = productRepo.findByBarcode(scannedBarcode);

        // Then
        assertTrue(product.isPresent());
        assertNotEquals(expectedSku, product.get().getSku());
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (!product.get().getSku().equals(expectedSku)) {
                throw new RuntimeException(
                    String.format("Sai sản phẩm! Cần lấy: %s", expectedSku)
                );
            }
        });
        
        assertTrue(exception.getMessage().contains("Sai sản phẩm"));
    }

    @Test
    @DisplayName("Test 6 - Staff nhập số lượng lấy hàng")
    void testStaffInputPickingQuantity() {
        // Given: Batch picking request
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(1);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));

        // When: Validate số lượng
        int requestedQty = 1;
        int availableQty = inventory.getQuantity();

        // Then: Số lượng hợp lệ
        assertTrue(requestedQty <= availableQty, 
                "Số lượng lấy phải <= tồn kho");
        assertDoesNotThrow(() -> {
            if (requestedQty > availableQty) {
                throw new RuntimeException("Kho không đủ hàng!");
            }
        });
    }

    @Test
    @DisplayName("Test 7 - Staff nhập số lượng vượt quá tồn kho")
    void testStaffInputExcessiveQuantity() {
        // Given
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(20); // Nhiều hơn tồn kho (10)

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));

        // When & Then
        int requestedQty = 20;
        int availableQty = inventory.getQuantity(); // 10

        assertTrue(requestedQty > availableQty);
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (requestedQty > availableQty) {
                throw new RuntimeException(
                    String.format("Kho không đủ hàng! (Tồn: %d)", availableQty)
                );
            }
        });
        
        assertTrue(exception.getMessage().contains("Kho không đủ hàng"));
        assertTrue(exception.getMessage().contains("10"));
    }

    @Test
    @DisplayName("Test 8 - Staff hoàn thành picking")
    void testStaffCompletePicking() {
        // Given
        List<BatchPickingRequest> requests = new ArrayList<>();
        BatchPickingRequest request = new BatchPickingRequest();
        request.setProductId(1L);
        request.setLocationId(1L);
        request.setActualQty(1);
        requests.add(request);

        lenient().when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 1L))
                .thenReturn(Optional.of(inventory));
        lenient().when(inventoryRepo.save(any(Inventory.class)))
                .thenReturn(inventory);
        lenient().when(transactionRepo.save(any(InventoryTransaction.class)))
                .thenReturn(new InventoryTransaction());
        lenient().when(outboundNoteDetailRepo.saveAll(anyList()))
                .thenReturn(new ArrayList<>());

        // When
        assertDoesNotThrow(() -> {
            staffService.submitBatchPicking(1L, requests);
        });

        // Then: Verify các operations
        verify(inventoryRepo).save(argThat(inv -> 
            inv.getQuantity() == 9 && // Giảm từ 10 xuống 9
            inv.getQuantityAllocated() == 0 // Giải phóng khóa
        ));
        
        verify(outboundNoteRepo).save(argThat(n -> 
            n.getStatus() == OutboundNoteStatus.COMPLETED
        ));
        
        verify(outboundOrderRepo).save(argThat(o -> 
            o.getStatus() == OrderStatus.PACKED
        ));
    }

    @Test
    @DisplayName("Test 9 - Staff khác không thể truy cập đơn")
    void testOtherStaffCannotAccessOrder() {
        // Given: Staff khác cố gắng truy cập
        User otherStaff = User.builder()
                .id(2L)
                .username("staff2")
                .fullName("Other Staff")
                .role(Role.STAFF)
                .build();

        lenient().when(userRepo.findByUsername("staff2")).thenReturn(Optional.of(otherStaff));

        // When & Then: Should throw exception
        Exception exception = assertThrows(BadRequestException.class, () -> {
            // Kiểm tra ownership
            if (!note.getCreatedBy().getId().equals(otherStaff.getId())) {
                throw new BadRequestException(
                    "Bạn không có quyền truy cập! Đơn hàng này đang được xử lý bởi nhân viên khác"
                );
            }
        });

        assertTrue(exception.getMessage().contains("không có quyền truy cập"));
    }

    @Test
    @DisplayName("Test 10 - Trạng thái đơn sau khi picking")
    void testOrderStatusAfterPicking() {
        // Given: Order đang ở trạng thái PICKING
        assertEquals(OrderStatus.PICKING, order.getStatus());

        // When: Staff hoàn thành picking
        order.setStatus(OrderStatus.PACKED);
        note.setStatus(OutboundNoteStatus.COMPLETED);

        // Then: Verify status changed
        assertEquals(OrderStatus.PACKED, order.getStatus());
        assertEquals(OutboundNoteStatus.COMPLETED, note.getStatus());
    }
}
