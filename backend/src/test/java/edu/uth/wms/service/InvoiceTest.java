package edu.uth.wms.service;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import edu.uth.wms.dto.request.InboundSubmitRequest;
import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.dto.request.SupplierInvoiceCreateRequest;
import edu.uth.wms.model.InboundNote;
import edu.uth.wms.model.Inventory;
import edu.uth.wms.model.Invoice;
import edu.uth.wms.model.Locations;
import edu.uth.wms.model.OutboundDetail;
import edu.uth.wms.model.OutboundNote;
import edu.uth.wms.model.OutboundNoteDetail;
import edu.uth.wms.model.OutboundOrder;
import edu.uth.wms.model.PODetail;
import edu.uth.wms.model.Products;
import edu.uth.wms.model.PurchaseOrder;
import edu.uth.wms.model.SupplierInvoice;
import edu.uth.wms.model.Suppliers;
import edu.uth.wms.model.User;
import edu.uth.wms.model.enums.InboundStatus;
import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.model.enums.LocationType;
import edu.uth.wms.model.enums.OutboundNoteStatus;
import edu.uth.wms.model.enums.POStatus;
import edu.uth.wms.repository.IIboundDetailRepository;
import edu.uth.wms.repository.IInboundNoteRepository;
import edu.uth.wms.repository.IInventoryRepository;
import edu.uth.wms.repository.IInvoiceRepository;
import edu.uth.wms.repository.IInvoiceDetailRepository;
import edu.uth.wms.repository.ILocationRepository;
import edu.uth.wms.repository.IOutboundNoteDetailRepository;
import edu.uth.wms.repository.IOutboundNoteRepository;
import edu.uth.wms.repository.IOutboundOrderRepository;
import edu.uth.wms.repository.IProductRepository;
import edu.uth.wms.repository.IPurchaseOrderRepository;
import edu.uth.wms.repository.ISupplierInvoiceRepository;
import edu.uth.wms.repository.ISupplierInvoiceDetailRepository;
import edu.uth.wms.repository.ITransactionRepository;
import edu.uth.wms.repository.IUserRepository;
import edu.uth.wms.service.impl.InboundServiceImpl;
import edu.uth.wms.service.impl.InvoiceServiceImpl;
import edu.uth.wms.service.impl.OutboundServiceImpl;
import edu.uth.wms.service.impl.SupplierInvoiceServiceImpl;
import edu.uth.wms.service.strategy.PickingStrategyFactory;
import edu.uth.wms.service.utils.SecurityUtils;

@ExtendWith(MockitoExtension.class)
public class InvoiceTest {

    // --- Mocks for InboundService ---
    @Mock private IPurchaseOrderRepository poRepo;
    @Mock private IInboundNoteRepository inboundNoteRepo;
    @Mock private IProductRepository productRepo;
    @Mock private IInventoryRepository inventoryRepo;
    @Mock private ILocationRepository locationRepo;
    @Mock private IIboundDetailRepository inboundDetailRepo;
    @Mock private IUserRepository userRepo;
    @Mock private ITransactionRepository transactionRepo;
    @Mock private IStocktakeService stocktakeService;
    @Mock private ISupplierInvoiceService supplierInvoiceService; // Injected Mock

    @InjectMocks
    private InboundServiceImpl inboundService;

    // --- Mocks for OutboundService ---
    @Mock private IOutboundOrderRepository outboundOrderRepo;
    @Mock private IOutboundNoteRepository outboundNoteRepo;
    @Mock private IOutboundNoteDetailRepository outboundNoteDetailRepo;
    @Mock private IInvoiceService invoiceService; // Injected Mock
    @Mock private ISystemConfigService configService;
    @Mock private PickingStrategyFactory strategyFactory;
    // Note: Some repos are shared (productRepo, inventoryRepo, locationRepo, userRepo, transactionRepo)

    @InjectMocks
    private OutboundServiceImpl outboundService;

    // --- Mocks for InvoiceService (Direct Test) ---
    @Mock private IInvoiceRepository invoiceRepo;
    // Removed duplicate mock: using outboundOrderRepo
    @Mock private IInvoiceDetailRepository invoiceDetailRepo;

    @InjectMocks
    private InvoiceServiceImpl invoiceServiceImpl;

    // --- Mocks for SupplierInvoiceService (Direct Test) ---
    @Mock private ISupplierInvoiceRepository supplierInvoiceRepo;
    @Mock private ISupplierInvoiceDetailRepository supplierInvoiceDetailRepo;

    @InjectMocks
    private SupplierInvoiceServiceImpl supplierInvoiceServiceImpl;

    private User mockUser;
    private MockedStatic<SecurityUtils> mockedSecurityUtils;
    private MockedStatic<SecurityContextHolder> mockedSecurityContextHolder;

    @BeforeEach
    void setUp() {
        mockUser = new User();
        mockUser.setUsername("testuser");
        mockUser.setFullName("Test User");

        // Mock SecurityUtils.getCurrentUserLogin()
        mockedSecurityUtils = Mockito.mockStatic(SecurityUtils.class);
        mockedSecurityUtils.when(SecurityUtils::getCurrentUserLogin).thenReturn("testuser");

        // Mock SecurityContextHolder for SupplierInvoiceService
        Authentication authentication = mock(Authentication.class);
        SecurityContext securityContext = mock(SecurityContext.class);
        Mockito.lenient().when(securityContext.getAuthentication()).thenReturn(authentication);
        Mockito.lenient().when(authentication.getName()).thenReturn("testuser");

        mockedSecurityContextHolder = Mockito.mockStatic(SecurityContextHolder.class);
        mockedSecurityContextHolder.when(SecurityContextHolder::getContext).thenReturn(securityContext);
    }

    @org.junit.jupiter.api.AfterEach
    void tearDown() {
        mockedSecurityUtils.close();
        mockedSecurityContextHolder.close();
    }

    @Test
    void TC_INV_01_AutoCreateSupplierInvoice_WhenInboundCompleted() {
        // Arrange
        Long poId = 1L;
        PurchaseOrder po = new PurchaseOrder();
        po.setId(poId);
        po.setStatus(POStatus.RECEIVING);
        PODetail poDetail = new PODetail();
        Products product = Products.builder().id(1L).name("Product A").sku("SKU-A").build();
        poDetail.setProduct(product);
        poDetail.setExpectedQty(10);
        po.setDetails(Collections.singletonList(poDetail));

        InboundNote note = new InboundNote();
        note.setId(100L);
        note.setPurchaseOrder(po);
        note.setStatus(InboundStatus.DRAFT);
        note.setProcessedBy(mockUser);
        note.setInboundDetails(new ArrayList<>());
        note.setNoteNumber("IBN-001");

        when(poRepo.findById(poId)).thenReturn(Optional.of(po));
        when(inboundNoteRepo.findByPurchaseOrderIdAndStatus(poId, InboundStatus.DRAFT))
                .thenReturn(Optional.of(note));
        when(productRepo.findById(1L)).thenReturn(Optional.of(product));
        when(userRepo.findByUsername("testuser")).thenReturn(Optional.of(mockUser));
        when(inboundNoteRepo.save(any(InboundNote.class))).thenAnswer(i -> i.getArgument(0)); // Return what is saved
        when(inventoryRepo.save(any(Inventory.class))).thenAnswer(i -> i.getArgument(0)); // Mock inventory save

        // Mock Location for Inventory Update
        Locations stageLoc = Locations.builder().id(10L).code("STAGE_LOC").locationType(LocationType.STAGE_LOC).build();
        when(locationRepo.findFirstByLocationType(LocationType.STAGE_LOC)).thenReturn(Optional.of(stageLoc));
        when(stocktakeService.isLocationLocked(any())).thenReturn(false);

        List<InboundSubmitRequest> items = Collections.singletonList(
            new InboundSubmitRequest(1L, 10, null)
        );

        // Act
        inboundService.processInboundResult(poId, items);

        // Assert
        // Verify that createInvoice was called on supplierInvoiceService
        verify(supplierInvoiceService, times(1)).createInvoice(any(SupplierInvoiceCreateRequest.class));

        // Verify note status
        assertEquals(InboundStatus.COMPLETED, note.getStatus());
    }

    @Test
    void TC_INV_02_AutoCreateSalesInvoice_WhenOutboundCompleted() {
        // Arrange
        Long orderId = 2L;
        OutboundOrder order = new OutboundOrder();
        order.setId(orderId);
        order.setOrderNumber("ORD-002");
        order.setStatus(edu.uth.wms.model.enums.OrderStatus.PICKING);

        Products product = Products.builder().id(1L).price(BigDecimal.valueOf(100)).build();

        OutboundDetail detail = new OutboundDetail();
        detail.setProduct(product);
        detail.setRequestedQty(5);
        order.setDetails(Collections.singletonList(detail));

        OutboundNote note = new OutboundNote();
        note.setId(200L);
        note.setOutboundOrder(order);
        note.setStatus(OutboundNoteStatus.DRAFT);
        note.setCreatedBy(mockUser);
        note.setDetails(new ArrayList<>());

        OutboundNoteDetail noteDetail = new OutboundNoteDetail();
        noteDetail.setProduct(product);
        noteDetail.setQuantity(5);
        note.getDetails().add(noteDetail);

        when(outboundOrderRepo.findById(orderId)).thenReturn(Optional.of(order));
        when(outboundNoteRepo.findByOutboundOrderId(orderId)).thenReturn(Optional.of(note));

        // Act
        outboundService.finishPicking(orderId);

        // Assert
        verify(invoiceService, times(1)).createInvoiceFromOrder(any(InvoiceCreateRequest.class));
        assertEquals(OutboundNoteStatus.COMPLETED, note.getStatus());
    }

    @Test
    void TC_INV_03_ExportInvoicePdf() {
        // Test for InvoiceServiceImpl (Sales Invoice)
        Long invoiceId = 300L;
        Invoice invoice = new Invoice();
        invoice.setId(invoiceId);
        invoice.setInvoiceNumber("INV-300");
        invoice.setTotalAmount(BigDecimal.valueOf(1000));

        when(invoiceRepo.findById(invoiceId)).thenReturn(Optional.of(invoice));

        // Act
        byte[] pdfBytes = invoiceServiceImpl.exportPdf(invoiceId);

        // Assert
        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 0);
        // Checking for PDF header signature "%PDF"
        if(pdfBytes.length >= 4) {
             assertEquals('%', pdfBytes[0]);
             assertEquals('P', pdfBytes[1]);
             assertEquals('D', pdfBytes[2]);
             assertEquals('F', pdfBytes[3]);
        }
    }

    @Test
    void TC_INV_04_UpdatePaymentStatus() {
        // Test for SupplierInvoiceServiceImpl
        Long invId = 400L;
        SupplierInvoice invoice = new SupplierInvoice();
        invoice.setId(invId);
        invoice.setStatus(InvoiceStatus.UNPAID);

        when(supplierInvoiceRepo.findById(invId)).thenReturn(Optional.of(invoice));
        when(supplierInvoiceRepo.save(any(SupplierInvoice.class))).thenAnswer(i -> i.getArgument(0));

        // Act
        supplierInvoiceServiceImpl.markAsPaid(invId);

        // Assert
        assertEquals(InvoiceStatus.PAID, invoice.getStatus());
        verify(supplierInvoiceRepo, times(1)).save(invoice);

        // Test for InvoiceServiceImpl (Sales Invoice)
        Long salesInvId = 500L;
        Invoice salesInvoice = new Invoice();
        salesInvoice.setId(salesInvId);
        salesInvoice.setStatus(InvoiceStatus.UNPAID);

        when(invoiceRepo.findById(salesInvId)).thenReturn(Optional.of(salesInvoice));
        when(invoiceRepo.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        invoiceServiceImpl.markAsPaid(salesInvId);
        assertEquals(InvoiceStatus.PAID, salesInvoice.getStatus());
    }
}
