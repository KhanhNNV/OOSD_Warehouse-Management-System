package edu.uth.wms.service;

import edu.uth.wms.service.impl.InvoiceServiceImpl;
import edu.uth.wms.dto.request.InvoiceCreateRequest;
import edu.uth.wms.model.*;
import edu.uth.wms.model.enums.InvoiceStatus;
import edu.uth.wms.model.enums.OrderStatus;
import edu.uth.wms.repository.*;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceImplTest {

    @InjectMocks
    private InvoiceServiceImpl invoiceService;

    @Mock private IOutboundOrderRepository outboundOrderRepository;
    @Mock private IInvoiceRepository invoiceRepository;
    @Mock private IInvoiceDetailRepository invoiceDetailRepository;
    @Mock private IOutboundNoteRepository outboundNoteRepository;
    @Mock private IOutboundNoteDetailRepository outboundNoteDetailRepository;

    // ========================================================================
    // TEST CHO TC_INV_02: Tự động tạo Hóa đơn Xuất
    // ========================================================================

    @Test
    @DisplayName("TC_INV_02: Tạo hóa đơn thành công (Happy Case)")
    void testCreateInvoiceFromOrder_Success() {
        // --- 1. GIVEN (Chuẩn bị dữ liệu) ---
        Long orderId = 1L;
        InvoiceCreateRequest request = new InvoiceCreateRequest();

        // Mock Order
        OutboundOrder mockOrder = new OutboundOrder();
        mockOrder.setId(orderId);
        mockOrder.setStatus(OrderStatus.PACKED); // Trạng thái hợp lệ

        // Mock Sản phẩm và giá (Để test logic tính tiền)
        Products product = new Products();
        product.setPrice(new BigDecimal("100000")); // 100k

        OutboundDetail detail = new OutboundDetail();
        detail.setProduct(product);
        detail.setAllocatedQty(2); // Số lượng 2
        mockOrder.setDetails(List.of(detail));

        // Mock OutboundNote (Phiếu xuất đã có sẵn trong DB)
        OutboundNote mockNote = new OutboundNote();
        mockNote.setId(50L);
        mockNote.setInvoice(null); // Quan trọng: Chưa có hóa đơn


        when(outboundOrderRepository.findById(any())).thenReturn(Optional.of(mockOrder));
        when(outboundNoteRepository.findByOutboundOrderId(any())).thenReturn(Optional.of(mockNote));

        // Mock lưu hóa đơn thì trả về chính nó
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(i -> i.getArgument(0));

        // --- 2. WHEN (Chạy hàm) ---
        // Hack nhẹ để request trả về ID đúng nếu DTO của bạn chưa có setter
        InvoiceCreateRequest spyRequest = spy(new InvoiceCreateRequest());
        doReturn(orderId).when(spyRequest).getOutboundOrderId();

        Invoice result = invoiceService.createInvoiceFromOrder(spyRequest);

        // --- 3. THEN (Kiểm tra kết quả) ---
        assertNotNull(result);
        assertEquals(InvoiceStatus.UNPAID, result.getStatus());
        assertEquals(mockNote, result.getOutboundNote()); // Phải link đúng phiếu xuất

        // Kiểm tra logic tính tiền (Quan trọng nhất của kế toán)
        // Tiền hàng: 100.000 * 2 = 200.000
        BigDecimal expectedTotal = new BigDecimal("200000");
        assertEquals(0, expectedTotal.compareTo(result.getTotalAmount()));

        // Thuế 8%: 200.000 * 0.08 = 16.000
        BigDecimal expectedTax = new BigDecimal("16000.00"); // Scale có thể khác, dùng compareTo
        assertEquals(0, expectedTax.compareTo(result.getTaxAmount()));

        // Tổng cộng: 216.000
        BigDecimal expectedFinal = new BigDecimal("216000");
        assertEquals(0, expectedFinal.compareTo(result.getFinalAmount()));

        // Verify: Đảm bảo đã gọi lệnh Save
        verify(invoiceRepository, times(1)).save(any(Invoice.class));
        verify(invoiceDetailRepository, times(1)).saveAll(anyList());
    }

    @Test
    @DisplayName("TC_INV_02_Fail: Báo lỗi nếu chưa có Phiếu xuất kho (Optional.empty)")
    void testCreateInvoice_Fail_NoOutboundNote() {
        Long orderId = 1L;
        OutboundOrder mockOrder = new OutboundOrder();
        mockOrder.setId(orderId);
        mockOrder.setStatus(OrderStatus.PACKED);

        when(outboundOrderRepository.findById(any())).thenReturn(Optional.of(mockOrder));

        // Giả lập tìm phiếu xuất trả về Empty (Chưa tạo phiếu)
        when(outboundNoteRepository.findByOutboundOrderId(any())).thenReturn(Optional.empty());

        InvoiceCreateRequest spyRequest = spy(new InvoiceCreateRequest());
        doReturn(orderId).when(spyRequest).getOutboundOrderId();

        // Assert Exception
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            invoiceService.createInvoiceFromOrder(spyRequest);
        });

        // Kiểm tra thông báo lỗi
        assertTrue(exception.getMessage().contains("Chưa có Outbound Note"));

        // Đảm bảo KHÔNG lưu gì cả
        verify(invoiceRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC_INV_02_Fail: Báo lỗi nếu Phiếu xuất đã có hóa đơn (Trùng)")
    void testCreateInvoice_Fail_Duplicate() {
        Long orderId = 1L;
        OutboundOrder mockOrder = new OutboundOrder();
        mockOrder.setId(orderId);
        mockOrder.setStatus(OrderStatus.PACKED);

        OutboundNote mockNote = new OutboundNote();
        mockNote.setInvoice(new Invoice()); // Đã có invoice rồi

        when(outboundOrderRepository.findById(any())).thenReturn(Optional.of(mockOrder));
        when(outboundNoteRepository.findByOutboundOrderId(any())).thenReturn(Optional.of(mockNote));

        InvoiceCreateRequest spyRequest = spy(new InvoiceCreateRequest());
        doReturn(orderId).when(spyRequest).getOutboundOrderId();

        // Assert Exception
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            invoiceService.createInvoiceFromOrder(spyRequest);
        });

        assertTrue(exception.getMessage().contains("ĐÃ CÓ HÓA ĐƠN RỒI"));
        verify(invoiceRepository, never()).save(any());
    }
}