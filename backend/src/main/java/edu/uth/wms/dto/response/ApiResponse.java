package edu.uth.wms.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL) // Bỏ qua các field null
public class ApiResponse<T> {

    private boolean success;

    private String status; // "success" hoặc "error"
    private String message; // Thông báo dễ đọc
    private T data; // Dữ liệu chính (User, Token...)
    private Object errors; // Chi tiết lỗi (nếu có)

    // Helper method cho Success Response
    public static <T> ApiResponse<T> success(T data, String message) {
        return ApiResponse.<T>builder().success(true).status("success").message(message).data(data).build();
    }

    public static <T> ApiResponse<T> success(T data) {
        return success(data, "Thành công");
    }

    // Helper method cho Error Response
    public static ApiResponse<Object> error(String message, Object errors) {
        return ApiResponse.builder().success(false).status("error").message(message).errors(errors).build();
    }
}