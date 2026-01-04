package edu.uth.wms.dto.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;
import lombok.experimental.SuperBuilder;

// 2. Response Tổng quan PO
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@JsonInclude(JsonInclude.Include.NON_NULL)

public class PurchaseOrderResponse{
    private Long id;
    private String poNumber; // Số PO
    private String supplierName; // Tên NCC
    private String status; // NEW, APPROVED...
    private String expectedDate; // yyyy-MM-dd

    private List<PoDetailResponse> details;
    // Thông tin người đang nhận việc (Lấy từ InboundNote)
    private Long assigneeId;
    private String assigneeName;
    
    private Integer totalItems; // Tổng số mặt hàng (loại SP)
    private Integer totalQuantity;// Tổng số lượng chi tiết
 

}