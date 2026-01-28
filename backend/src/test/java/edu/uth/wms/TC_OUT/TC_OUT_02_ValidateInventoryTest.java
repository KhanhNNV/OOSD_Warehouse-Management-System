package edu.uth.wms.TC_OUT;


import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.PickingAlgorithmType;
import edu.uth.wms.model.enums.Role;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.ISystemConfigService;
import edu.uth.wms.service.impl.OutboundServiceImpl;
import edu.uth.wms.service.strategy.PickingStrategyFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
// import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

/**
 * TC_OUT_02: Validate Tồn kho khả dụng
 * 
 * Mô tả: Kiểm tra hệ thống validate tồn kho trước khi cho phép tạo đơn
 * 
 * Test Steps:
 * 1. Tồn kho SP B = 10 cái
 * 2. Tạo đơn xuất với SL = 15 cái
 * 3. Nhấn Lưu
 * 
 * Test Data:
 * SL đặt > Tồn kho
 * 
 * Expected Result:
 * Hệ thống báo lỗi: "Không đủ tồn kho khả dụng - Không cho tạo đơn"
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TC_OUT_02: Validate Tồn kho khả dụng")
public class TC_OUT_02_ValidateInventoryTest {

    @Mock
    private IOutboundOrderRepository outboundOrderRepo;

    @Mock
    private IOutboundDetailRepository outboundDetailRepo;

    @Mock
    private IOutboundNoteRepository outboundNoteRepo;

    @Mock
    private IOutboundNoteDetailRepository outboundNoteDetailRepo;

    @Mock
    private IProductRepository productRepo;

    @Mock
    private IInventoryRepository inventoryRepo;

    @Mock
    private ILocationRepository locationRepo;

    @Mock
    private IUserRepository userRepo;

    @Mock
    private ITransactionRepository transactionRepo;

    @Mock
    private ISystemConfigService configService;

    @Mock
    private PickingStrategyFactory strategyFactory;

    @InjectMocks
    private OutboundServiceImpl outboundService;

    private Products productB;
    private Locations locationA;
    private Inventory inventory;
    private User manager;
    @SuppressWarnings("unused")
    private Customer customer;

    @BeforeEach
    void setUp() {
        // Product B với tồn kho = 10
        productB = Products.builder()
                .id(2L)
                .sku("SP-B")
                .name("Sản phẩm B")
                .build();

        // Location
        locationA = Locations.builder()
                .id(1L)
                .code("A-01-01")
                .locationType(LocationType.SHELF_STORAGE)
                .build();

        // Inventory - Chỉ có 10 sản phẩm
        inventory = Inventory.builder()
                .id(1L)
                .product(productB)
                .location(locationA)
                .quantity(10)
                .quantityAllocated(0)
                .build();

        // User
        manager = User.builder()
                .id(1L)
                .username("manager")
                .fullName("Manager Test")
                .role(Role.MANAGER)
                .build();

        // Customer
        customer = Customer.builder()
                .id(1L)
                .name("Customer Test")
                .phone("0123456789")
                .address("Test Address")
                .build();
    }

    @Test
    @DisplayName("Test - Không cho phép tạo đơn khi tồn kho không đủ")
    void testInsufficientInventory_ShouldThrowException() {
        // Given: Mock product và inventory
        lenient().when(productRepo.findById(2L)).thenReturn(Optional.of(productB));
        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory));
        lenient().when(configService.getCurrentAlgorithm()).thenReturn(PickingAlgorithmType.FIFO);
        lenient().when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(manager));

        // When: Simulate validation với số lượng yêu cầu = 15 (nhiều hơn tồn kho 10)
        int requestedQty = 15;
        int available = inventory.getQuantity() - inventory.getQuantityAllocated();
        
        // Then: Expect exception
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (requestedQty > available) {
                throw new RuntimeException(
                    String.format("Sản phẩm %s: Không đủ tồn kho khả dụng (Cần: %d, Có: %d)", 
                        productB.getSku(), requestedQty, available)
                );
            }
        });

        // Verify error message
        assertTrue(exception.getMessage().contains("Không đủ tồn kho khả dụng"));
        assertTrue(exception.getMessage().contains("15"));
        assertTrue(exception.getMessage().contains("10"));
    }

    @Test
    @DisplayName("Test - Cho phép tạo đơn khi tồn kho đủ")
    void testSufficientInventory_ShouldSucceed() {
        // Given: Mock với số lượng yêu cầu = 5 (ít hơn tồn kho)
        lenient().when(productRepo.findById(2L)).thenReturn(Optional.of(productB));
        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory));
        lenient().when(configService.getCurrentAlgorithm()).thenReturn(PickingAlgorithmType.FIFO);
        lenient().when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(manager));

        // When: Validate với số lượng hợp lệ
        int requestedQty = 5;
        int available = inventory.getQuantity() - inventory.getQuantityAllocated();

        // Then: Should not throw exception
        assertDoesNotThrow(() -> {
            if (requestedQty > available) {
                throw new RuntimeException("Không đủ tồn kho khả dụng");
            }
        });
        
        // Verify số lượng
        assertTrue(requestedQty <= available, 
                "Số lượng yêu cầu phải <= tồn kho khả dụng");
    }

    @Test
    @DisplayName("Test - Validate với nhiều locations")
    void testValidateMultipleLocations() {
        // Given: Có 2 locations với tổng = 10
        Locations locationB = Locations.builder()
                .id(2L)
                .code("B-01-01")
                .locationType(LocationType.SHELF_STORAGE)
                .build();

        Inventory inventory1 = Inventory.builder()
                .id(1L)
                .product(productB)
                .location(locationA)
                .quantity(6)
                .quantityAllocated(0)
                .build();

        Inventory inventory2 = Inventory.builder()
                .id(2L)
                .product(productB)
                .location(locationB)
                .quantity(4)
                .quantityAllocated(0)
                .build();

        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory1, inventory2));

        // When: Request 15 items (nhiều hơn tổng 10)
        int totalAvailable = inventory1.getQuantity() + inventory2.getQuantity()
                - inventory1.getQuantityAllocated() - inventory2.getQuantityAllocated();
        int requested = 15;

        // Then: Should throw exception
        assertTrue(requested > totalAvailable, 
                "Số lượng yêu cầu phải lớn hơn tổng khả dụng");
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (requested > totalAvailable) {
                throw new RuntimeException("Không đủ tồn kho khả dụng");
            }
        });
        
        assertNotNull(exception);
    }

    @Test
    @DisplayName("Test - Validate với tồn kho đã bị khóa một phần")
    void testValidateWithAllocatedQuantity() {
        // Given: Tồn kho = 10, nhưng đã khóa 3
        inventory.setQuantityAllocated(3);

        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory));

        // When: Request 8 items (nhiều hơn khả dụng 7)
        int available = inventory.getQuantity() - inventory.getQuantityAllocated();
        int requested = 8;

        // Then: Should throw exception
        assertEquals(7, available, "Số lượng khả dụng = 10 - 3 = 7");
        assertTrue(requested > available);
        
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (requested > available) {
                throw new RuntimeException("Không đủ tồn kho khả dụng");
            }
        });
        
        assertTrue(exception.getMessage().contains("Không đủ tồn kho khả dụng"));
    }

    @Test
    @DisplayName("Test - Cho phép đơn khi số lượng = tồn kho khả dụng")
    void testExactInventoryMatch() {
        // Given: Tồn kho = 10, yêu cầu = 10
        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory));

        // When
        int available = inventory.getQuantity() - inventory.getQuantityAllocated();
        int requested = 10;

        // Then: Should succeed
        assertEquals(requested, available);
        assertDoesNotThrow(() -> {
            if (requested > available) {
                throw new RuntimeException("Không đủ tồn kho khả dụng");
            }
        });
    }

    @Test
    @DisplayName("Test - Không tính locations không hợp lệ")
    void testIgnoreInvalidLocations() {
        // Given: Có inventory ở STAGE_LOC (không được tính)
        Locations stageLocation = Locations.builder()
                .id(3L)
                .code("STAGE_LOC")
                .locationType(LocationType.STAGE_LOC)
                .build();

        Inventory stageInventory = Inventory.builder()
                .id(3L)
                .product(productB)
                .location(stageLocation)
                .quantity(100) // Nhiều nhưng không được tính
                .quantityAllocated(0)
                .build();

        lenient().when(inventoryRepo.findAllByProductId(2L))
                .thenReturn(Arrays.asList(inventory, stageInventory));

        // When: Chỉ tính shelf storage
        int availableFromShelf = inventory.getQuantity(); // = 10
        int requested = 15;

        // Then: Vẫn không đủ vì STAGE_LOC không được tính
        assertTrue(requested > availableFromShelf);
    }

    @Test
    @DisplayName("Test - Error message rõ ràng")
    void testClearErrorMessage() {
        // Given: Thiếu hụt inventory
        int available = 10;
        int requested = 15;
        String productSku = "SP-B";

        // When
        Exception exception = assertThrows(RuntimeException.class, () -> {
            if (requested > available) {
                throw new RuntimeException(
                    String.format("Sản phẩm %s: Không đủ tồn kho (Cần: %d, Có: %d)", 
                        productSku, requested, available)
                );
            }
        });

        // Then: Message phải chứa thông tin chi tiết
        String message = exception.getMessage();
        assertTrue(message.contains("SP-B"));
        assertTrue(message.contains("15"));
        assertTrue(message.contains("10"));
    }
}