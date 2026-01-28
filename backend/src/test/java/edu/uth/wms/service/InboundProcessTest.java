package edu.uth.wms.service;

import edu.uth.wms.dto.internal.PoExcelItem;
import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.request.RelocateRequest;
import edu.uth.wms.dto.response.InboundNoteResponse;
import edu.uth.wms.dto.response.PurchaseOrderResponse;
import edu.uth.wms.exceptions.InboundValidationException;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.*;
import edu.uth.wms.repository.*;
import edu.uth.wms.service.impl.InboundServiceImpl;
import edu.uth.wms.service.impl.InventoryMovementServiceImpl;
import edu.uth.wms.service.impl.PurchaseOrderServiceImpl;
import edu.uth.wms.service.utils.ExcelHelper;
import edu.uth.wms.service.utils.SecurityUtils;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class InboundProcessTest {

    @Mock private IPurchaseOrderRepository poRepo;
    @Mock private IProductRepository productRepo;
    @Mock private ISupplierRepository supplierRepo;
    @Mock private ExcelHelper excelHelper;
    @Mock private IUserRepository userRepo;
    @Mock private IInboundNoteRepository inboundNoteRepo;
    @Mock private IInventoryRepository inventoryRepo;
    @Mock private ILocationRepository locationRepo;
    @Mock private IIboundDetailRepository inboundDetailRepo;
    @Mock private ITransactionRepository transactionRepo;
    @Mock private IStocktakeService stocktakeService;

    @InjectMocks private PurchaseOrderServiceImpl poService;
    @InjectMocks private InboundServiceImpl inboundService;
    @InjectMocks private InventoryMovementServiceImpl inventoryMovementService;

    private MockedStatic<SecurityUtils> mockedSecurity;
    private User mockUser;
    private Products productA;
    private Products productB;

    @BeforeEach
    void setUp() {
        mockedSecurity = mockStatic(SecurityUtils.class);
        mockedSecurity.when(SecurityUtils::getCurrentUserLogin).thenReturn("testuser");

        mockUser = new User();
        mockUser.setUsername("testuser");
        mockUser.setRole(Role.STAFF);

        productA = Products.builder()
                .id(1L)
                .sku("SP_A")
                .name("Sản phẩm A")
                .barcode("BAR_A")
                .build();

        productB = Products.builder()
                .id(2L)
                .sku("SP_B")
                .name("Sản phẩm B")
                .barcode("BAR_B")
                .build();
    }

    @AfterEach
    void tearDown() {
        mockedSecurity.close();
    }

    @Test
    void TC_IN_01_ImportPoFromExcel() throws Exception {
        // Arrange
        Long supplierId = 1L;
        Suppliers supplier = Suppliers.builder().id(supplierId).name("Supplier A").build();

        when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(mockUser));
        when(supplierRepo.findById(supplierId)).thenReturn(Optional.of(supplier));

        MockMultipartFile file = new MockMultipartFile("file", "PO_Sample.xlsx",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", new byte[0]);
        when(excelHelper.hasExcelFormat(file)).thenReturn(true);

        List<PoExcelItem> excelItems = new ArrayList<>();
        PoExcelItem itemA = new PoExcelItem();
        itemA.setSku("SP_A"); itemA.setQuantity(100);
        PoExcelItem itemB = new PoExcelItem();
        itemB.setSku("SP_B"); itemB.setQuantity(50);
        excelItems.add(itemA); excelItems.add(itemB);

        when(excelHelper.excelToPoItems(any(InputStream.class))).thenReturn(excelItems);
        when(productRepo.findBySku("SP_A")).thenReturn(Optional.of(productA));
        when(productRepo.findBySku("SP_B")).thenReturn(Optional.of(productB));
        when(poRepo.save(any(PurchaseOrder.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        PurchaseOrderResponse response = poService.createPoFromExcel(file, supplierId);

        // Assert
        assertNotNull(response);
        assertEquals("NEW", response.getStatus()); // NEW corresponds to 'Pending'
        assertEquals(2, response.getTotalItems());
        assertEquals(150, response.getTotalQuantity());
        verify(poRepo, times(1)).save(any(PurchaseOrder.class));
    }

    @Test
    void TC_IN_02_StaffReceivesGoods_HappyPath() {
        // Arrange
        Long poId = 1L;
        PurchaseOrder po = createMockPo(poId);
        InboundNote draftNote = createMockInboundNote(po, InboundStatus.DRAFT);

        when(poRepo.findById(poId)).thenReturn(Optional.of(po));
        when(inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT)).thenReturn(Optional.of(draftNote));
        when(productRepo.findById(1L)).thenReturn(Optional.of(productA));
        when(productRepo.findById(2L)).thenReturn(Optional.of(productB));
        when(inboundNoteRepo.save(any(InboundNote.class))).thenAnswer(i -> i.getArgument(0));
        when(inventoryRepo.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));
        when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(mockUser));

        Locations stageLoc = Locations.builder()
                .id(10L)
                .locationType(LocationType.STAGE_LOC)
                .code("STAGE_01")
                .build();
        when(locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)).thenReturn(Optional.of(stageLoc));
        when(stocktakeService.isLocationLocked(anyString())).thenReturn(false);

        List<InboundSubmitRequest> actualItems = Arrays.asList(
            new InboundSubmitRequest(1L, 100, null),
            new InboundSubmitRequest(2L, 50, null)
        );

        // Act
        InboundNote result = inboundService.processInboundResult(poId, actualItems);

        // Assert
        assertEquals(InboundStatus.COMPLETED, result.getStatus());
        assertEquals(POStatus.COMPLETED, po.getStatus());
        verify(inventoryRepo, atLeastOnce()).save(any(Inventory.class));
    }

    @Test
    void TC_IN_03_DiscrepancyHandling() {
        // Arrange
        Long poId = 1L;
        PurchaseOrder po = createMockPo(poId);
        InboundNote draftNote = createMockInboundNote(po, InboundStatus.DRAFT);

        when(poRepo.findById(poId)).thenReturn(Optional.of(po));
        when(inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT)).thenReturn(Optional.of(draftNote));

        // 1. Test validation failure in processInboundResult
        List<InboundSubmitRequest> mismatchItems = Arrays.asList(
            new InboundSubmitRequest(1L, 100, null),
            new InboundSubmitRequest(2L, 45, null) // Expected 50
        );

        assertThrows(InboundValidationException.class, () -> {
            inboundService.processInboundResult(poId, mismatchItems);
        });

        // 2. Test reporting discrepancy via submitIbnoteReport
        when(productRepo.findById(1L)).thenReturn(Optional.of(productA));
        when(productRepo.findById(2L)).thenReturn(Optional.of(productB));
        when(inboundNoteRepo.save(any(InboundNote.class))).thenAnswer(i -> i.getArgument(0));

        InboundNoteResponse response = inboundService.submitIbnoteReport(poId, mismatchItems);

        // Assert
        assertEquals(InboundStatus.VERIFYING, response.getStatus());
        assertTrue(response.getInboundDetails().stream()
            .anyMatch(d -> d.getProductId().equals(2L) && d.getNote().contains("Thiếu hàng")));
    }

    @Test
    void TC_IN_04_SignatureAndCompletion() {
        // Covered by TC_IN_02 logic but explicitly checking inventory
        // Arrange
        Long poId = 1L;
        PurchaseOrder po = createMockPo(poId);
        InboundNote draftNote = createMockInboundNote(po, InboundStatus.DRAFT);

        when(poRepo.findById(poId)).thenReturn(Optional.of(po));
        when(inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT)).thenReturn(Optional.of(draftNote));
        when(productRepo.findById(anyLong())).thenReturn(Optional.of(productA));
        when(userRepo.findByUsername(anyString())).thenReturn(Optional.of(mockUser));
        when(inboundNoteRepo.save(any(InboundNote.class))).thenAnswer(i -> i.getArgument(0));

        Locations stageLoc = Locations.builder()
                .id(10L)
                .locationType(LocationType.STAGE_LOC)
                .code("STAGE_01")
                .build();
        when(locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)).thenReturn(Optional.of(stageLoc));

        Inventory inventoryA = new Inventory();
        inventoryA.setProduct(productA);
        inventoryA.setQuantity(0);
        inventoryA.setLocation(stageLoc);
        when(inventoryRepo.findByProduct_IdAndLocation_Id(1L, 10L)).thenReturn(Optional.of(inventoryA));
        when(inventoryRepo.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0));

        List<InboundSubmitRequest> actualItems = Arrays.asList(
            new InboundSubmitRequest(1L, 100, null),
            new InboundSubmitRequest(2L, 50, null)
        );
        when(productRepo.findById(2L)).thenReturn(Optional.of(productB));

        // Act
        inboundService.processInboundResult(poId, actualItems);

        // Assert
        assertEquals(100, inventoryA.getQuantity());
        verify(inventoryRepo).save(argThat(inv -> inv.getProduct().getId().equals(1L) && inv.getQuantity() == 100));
    }

    @Test
    void TC_IN_05_PutAway() {
        // Arrange
        RelocateRequest request = new RelocateRequest();
        request.setBarcode("BAR_A");
        request.setFromLocationCode("STAGE_01");
        request.setToLocationCode("A-01-01");
        request.setQuantity(100);

        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(mockUser));

        Locations stageLoc = Locations.builder()
                .id(10L)
                .code("STAGE_01")
                .build();
        Locations shelfLoc = Locations.builder()
                .id(20L)
                .code("A-01-01")
                .build();

        when(locationRepo.findByCode("STAGE_01")).thenReturn(Optional.of(stageLoc));
        when(locationRepo.findByCode("A-01-01")).thenReturn(Optional.of(shelfLoc));
        when(productRepo.findByBarcode("BAR_A")).thenReturn(Optional.of(productA));

        Inventory stageInv = new Inventory();
        stageInv.setProduct(productA);
        stageInv.setQuantity(100);
        stageInv.setQuantityAllocated(0);
        stageInv.setLocation(stageLoc);

        when(inventoryRepo.findByLocationIdAndProductId(10L, 1L)).thenReturn(Optional.of(stageInv));
        when(inventoryRepo.findByLocationIdAndProductId(20L, 1L)).thenReturn(Optional.empty());

        // Act
        inventoryMovementService.relocateInventory("testuser", request);

        // Assert
        assertEquals(0, stageInv.getQuantity());
        verify(inventoryRepo).save(argThat(inv -> inv.getLocation().getCode().equals("A-01-01") && inv.getQuantity() == 100));
        verify(transactionRepo, times(2)).save(any(InventoryTransaction.class));
    }

    private PurchaseOrder createMockPo(Long id) {
        PurchaseOrder po = new PurchaseOrder();
        po.setId(id);
        po.setStatus(POStatus.NEW);

        List<PODetail> details = new ArrayList<>();
        PODetail d1 = new PODetail();
        d1.setProduct(productA); d1.setExpectedQty(100); d1.setPurchaseOrder(po);
        PODetail d2 = new PODetail();
        d2.setProduct(productB); d2.setExpectedQty(50); d2.setPurchaseOrder(po);
        details.add(d1); details.add(d2);
        po.setDetails(details);
        return po;
    }

    private InboundNote createMockInboundNote(PurchaseOrder po, InboundStatus status) {
        InboundNote note = new InboundNote();
        note.setId(100L);
        note.setPurchaseOrder(po);
        note.setStatus(status);
        note.setProcessedBy(mockUser);
        note.setInboundDetails(new ArrayList<>());
        return note;
    }
}
