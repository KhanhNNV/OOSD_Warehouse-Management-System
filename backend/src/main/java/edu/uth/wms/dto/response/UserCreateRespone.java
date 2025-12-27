package edu.uth.wms.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class UserCreateRespone {
    private Long id;
    private String username;
    private String fullName;
    private String phoneNumber;
    private String role;
}
