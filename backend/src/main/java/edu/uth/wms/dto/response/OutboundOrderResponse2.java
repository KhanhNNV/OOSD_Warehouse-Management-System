package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class OutboundOrderResponse2 {
    private Long id;
    private String orderNumber;
    private String status;
    private LocalDateTime createdDate;

    // Thay vì trả về cả object User/Customer nặng nề, ta dùng DTO con hoặc class thu gọn
    private CustomerSummary customer;
    private UserSummary createdBy;

    // --- Inner Class cho gọn (Hoặc tạo file riêng cũng được) ---
    @Data
    @Builder
    public static class CustomerSummary {
        private Long id;
        private String name;
        private String phone;
        private String address;
    }

    @Data
    @Builder
    public static class UserSummary {
        private Long id;
        private String fullName;
        private String username;
    }
}