package edu.uth.wms.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // Bắt tất cả các lỗi chưa được xử lý (Exception.class)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<String> handleAllExceptions(Exception ex) {
        // In lỗi ra console để lập trình viên xem (nếu cần debug)
        ex.printStackTrace(); 
        
        // Trả về cho người dùng (Frontend/Postman) đúng 1 dòng thông báo ngắn gọn
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Lỗi xử lý: " + ex.getMessage()); // Tạm vẫn để ex.getMessage() để bắt lỗi sau khi xong có thể đồi thành 1 strung nếu muốn
    }
    
    //Bắt riêng lỗi RuntimeException để trả về 400 Bad Request
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body("Yêu cầu không hợp lệ: " + ex.getMessage());
    }
}