package edu.uth.wms.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CategoryRequest {
    @NotBlank(message = "Tên danh mục không được để trống")
    private String name;

    private String description;

    // Có thể mở lại comment trường code nếu sử dụng mã danh mục
    // @NotBlank
    // @Pattern(regexp = "^[A-Z0-9_]+$", message = "Mã chỉ chứa chữ hoa, số và gạch
    // dưới")
    // private String code;
}
